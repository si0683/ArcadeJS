import { expect, test, type Page } from "@playwright/test"

import { mockPlatformSdk } from "./sdk-mock"

// What game portals check by hand on moderation, checked on every run (npm run portal adds the
// build checks of scripts/portal-check.mjs). Typical reasons a game is sent back:
//   the page scrolls on arrows / space, text gets selected, a long tap opens the browser menu,
//   sound keeps playing in a hidden tab, the language ignores the player's, music starts by itself.

type GameWindow = Window & { game: import("phaser").Game; platform: { name: string } }
const inGame = <T>(page: Page, read: (w: GameWindow) => T) => page.evaluate(`(${read})(window)`) as Promise<T>

const openMenu = async (page: Page) => {
  await page.goto("/")
  await page.waitForFunction(() => (window as unknown as GameWindow).game?.scene.isActive("menu"))
}

test.beforeEach(({ page }) => mockPlatformSdk(page))

test("@portal the page never scrolls, selects text or opens the context menu", async ({ page }) => {
  await openMenu(page)
  await page.evaluate(() => (window as unknown as GameWindow).game.scene.getScene("menu").scene.start("game"))
  await page.waitForFunction(() => (window as unknown as GameWindow).game.scene.isActive("game"))
  for (const key of ["ArrowDown", "Space", "PageDown", "End", "ArrowUp"]) await page.keyboard.press(key)
  expect(await page.evaluate(() => [scrollX, scrollY, document.scrollingElement?.scrollTop ?? 0])).toEqual([0, 0, 0])
  expect(await page.evaluate(() => getComputedStyle(document.body).userSelect)).toBe("none")
  const menuBlocked = await page.evaluate(() => {
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
    document.querySelector("canvas")!.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(menuBlocked).toBe(true)
})

test("@portal no sound before the player touches the game", async ({ page }) => {
  await openMenu(page)
  await page.waitForTimeout(500)
  expect(await inGame(page, (w) => w.game.sound.getAll().filter((s) => s.isPlaying).length)).toBe(0)
})

test("@portal a hidden tab is silent and frozen", async ({ page }) => {
  await openMenu(page)
  // Portal SDKs (Yandex, GamePush) pause through their own events; the browser event is ours
  test.skip(
    !["none", "crazygames", "poki"].includes(await inGame(page, (w) => w.platform.name)),
    "the SDK pauses itself",
  )
  // A key press unlocks the browser's audio, as a real player does (muting a locked context is a no-op)
  await page.keyboard.press("Enter")
  await page.waitForFunction(() => !(window as unknown as GameWindow).game.sound.locked)
  const hide = (hidden: boolean) =>
    page.evaluate((h) => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => h })
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (h ? "hidden" : "visible") })
      document.dispatchEvent(new Event("visibilitychange"))
    }, hidden)
  // Silent: muted, or the audio context suspended (the mute flag reads back after the next audio frame)
  const state = (w: GameWindow) => {
    const sound = w.game.sound as unknown as { mute: boolean; context?: AudioContext }
    return {
      silent: sound.mute || (sound.context !== undefined && sound.context.state !== "running"),
      paused: w.game.isPaused,
    }
  }
  await hide(true)
  await expect.poll(() => inGame(page, state)).toEqual({ silent: true, paused: true })
  await hide(false)
  await expect.poll(() => inGame(page, state)).toEqual({ silent: false, paused: false })
})

for (const [locale, title] of [
  ["ru-RU", "Моя игра"],
  ["en-US", "My Game"],
] as const) {
  test(`@portal the language follows the player: ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale })
    const page = await context.newPage()
    await mockPlatformSdk(page)
    await openMenu(page)
    test.skip((await inGame(page, (w) => w.platform.name)) !== "none", "the SDK mock sets its own language")
    const texts = await inGame(page, (w) =>
      w.game.scene
        .getScene("menu")
        .children.list.filter((o) => o.type === "Text")
        .map((o) => (o as unknown as { text: string }).text),
    )
    expect(texts).toContain(title)
    await context.close()
  })
}
