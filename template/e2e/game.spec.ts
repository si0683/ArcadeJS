import { expect, test, type Page } from "@playwright/test"

import { mockPlatformSdk, sdkCalls } from "./sdk-mock"

// Smoke check of the real game in a browser: it loads without errors, the menu works,
// the shop sells where the platform allows it, the level starts and the player moves.
// Add a check here for every new core mechanic.

type GameWindow = Window & {
  game: import("phaser").Game
  save: typeof import("../src/save").save
  shop: typeof import("../src/shop").shop
  platform: typeof import("../src/platform").platform
}

/** Runs `read` in the page with the dev-mode globals (window.game, save, shop, platform) */
const inGame = <T>(page: Page, read: (w: GameWindow) => T) => page.evaluate(`(${read})(window)`) as Promise<T>

const activeScene = (page: Page, key: string) =>
  page.waitForFunction((k) => (window as unknown as GameWindow).game?.scene.isActive(k), key)

test("the game loads, starts and the player moves", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })

  await mockPlatformSdk(page)
  await page.goto("/")
  await activeScene(page, "menu")
  await expect(page.locator("canvas")).toBeVisible()

  // Settings shortcut: M lowers the music volume and does not start the game
  await page.keyboard.press("KeyM")
  expect(await inGame(page, (w) => w.save.get().settings.music)).toBe(0.75)
  expect(await inGame(page, (w) => w.game.scene.isActive("menu"))).toBe(true)

  // Shop: where purchases work (dev mode without an SDK, Yandex), B buys "Remove ads"
  if (await inGame(page, (w) => w.platform.features.purchases)) {
    await page.keyboard.press("KeyB")
    await page.waitForFunction(() => (window as unknown as GameWindow).shop.has("no_ads"))
  }

  // Any other key starts the level
  await page.keyboard.press("Enter")
  await activeScene(page, "game")

  const playerX = () =>
    page.evaluate(() => {
      const scene = (window as unknown as GameWindow).game.scene.getScene("game") as unknown as {
        player: { x: number }
      }
      return scene.player.x
    })
  // Let the player land, then run right
  await page.waitForTimeout(500)
  const before = await playerX()
  await page.keyboard.down("ArrowRight")
  await page.waitForTimeout(700)
  await page.keyboard.up("ArrowRight")
  expect(await playerX()).toBeGreaterThan(before + 20)

  // With a portal SDK the game reports loading and play (moderation checks these)
  const calls = await sdkCalls(page)
  if (calls) expect(calls).toEqual(expect.arrayContaining(["ready", "gameplayStart"]))

  expect(errors).toEqual([])
})
