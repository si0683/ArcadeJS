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
  replay: typeof import("../src/replay").replay
}

/** Runs `read` in the page with the dev-mode globals (window.game, save, shop, platform) */
const inGame = <T>(page: Page, read: (w: GameWindow) => T) => page.evaluate(`(${read})(window)`) as Promise<T>

const activeScene = (page: Page, key: string) =>
  page.waitForFunction((k) => (window as unknown as GameWindow).game?.scene.isActive(k), key)

// Every test serves fake portal SDKs: browser checks never reach a real portal, even with keys in .env
test.beforeEach(({ page }) => mockPlatformSdk(page))

test("the game loads, starts and the player moves", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })

  await page.goto("/")
  await activeScene(page, "menu")
  await expect(page.locator("canvas")).toBeVisible()

  // Settings shortcut: M lowers the music volume and does not start the game
  await page.keyboard.press("KeyM")
  // Phaser handles keys on its next frame: poll instead of reading at once
  await expect.poll(() => inGame(page, (w) => w.save.get().settings.music)).toBe(0.75)
  expect(await inGame(page, (w) => w.game.scene.isActive("menu"))).toBe(true)
  // E switches the screen effects off and back on
  await page.keyboard.press("KeyE")
  await expect.poll(() => inGame(page, (w) => w.save.get().settings.effects)).toBe(false)
  await page.keyboard.press("KeyE")
  await expect.poll(() => inGame(page, (w) => w.save.get().settings.effects)).toBe(true)

  // Shop: where purchases work (dev mode without an SDK, Yandex), B buys "Remove ads"
  if (await inGame(page, (w) => w.platform.features.purchases)) {
    await page.keyboard.press("KeyB")
    await page.waitForFunction(() => (window as unknown as GameWindow).shop.has("no_ads"))
  }

  // Any other key opens the level select; the second level is closed, Enter starts the first.
  // A key pressed while the screen is still fading in can be lost on a busy machine (parallel tests): wait it out
  await page.keyboard.press("Enter")
  await activeScene(page, "levels")
  await page.waitForTimeout(300)
  await page.keyboard.press("Enter")
  await activeScene(page, "game")
  expect(await inGame(page, (w) => w.game.registry.get("level"))).toBe(0)

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

  const playerY = () =>
    page.evaluate(() => {
      const scene = (window as unknown as GameWindow).game.scene.getScene("game") as unknown as {
        player: { y: number }
      }
      return scene.player.y
    })
  await page.waitForTimeout(300)
  const startY = await playerY()
  if ((await inGame(page, (w) => w.game.registry.get("genre"))) === "topdown") {
    // Top-down: ↓ walks down
    await page.keyboard.down("ArrowDown")
    await page.waitForTimeout(500)
    await page.keyboard.up("ArrowDown")
    expect(await playerY()).toBeGreaterThan(startY + 10)
  } else {
    // Platformer: Space lifts the player off the ground
    await page.keyboard.down("Space")
    await page.waitForTimeout(200)
    expect(await playerY()).toBeLessThan(startY - 10)
    await page.keyboard.up("Space")
    await page.waitForTimeout(800)
  }

  // Pause: Esc opens the pause screen and freezes the level, Esc again resumes
  await page.keyboard.press("Escape")
  await activeScene(page, "pause")
  expect(await inGame(page, (w) => w.game.scene.isPaused("game"))).toBe(true)
  await page.screenshot({ path: "test-results/pause.png" })
  await page.keyboard.press("Escape")
  await activeScene(page, "game")
  expect(await inGame(page, (w) => w.game.scene.isActive("pause"))).toBe(false)

  // With a portal SDK the game reports loading and play (moderation checks these)
  const calls = await sdkCalls(page)
  if (calls) expect(calls).toEqual(expect.arrayContaining(["ready", "gameplayStart", "gameplayStop"]))

  expect(errors).toEqual([])
})

test("levels: finishing a level gives stars and opens the next one", async ({ page }) => {
  await page.goto("/")
  await activeScene(page, "menu")
  await page.keyboard.press("Enter")
  await activeScene(page, "levels")
  await page.keyboard.press("Enter")
  await activeScene(page, "game")
  // The dev shortcut F6 wins the level at once
  await page.waitForTimeout(400)
  await page.keyboard.press("F6")
  await activeScene(page, "levels")
  const progress = await inGame(page, (w) => w.save.get().levels)
  expect(progress.level1.stars).toBeGreaterThan(0)
  // Focus moved to level 2, which is open now
  await page.keyboard.press("Enter")
  await activeScene(page, "game")
  expect(await inGame(page, (w) => w.game.registry.get("level"))).toBe(1)
  expect(await inGame(page, (w) => w.save.get().achievements)).toContain("first_win")
})

test("settings: the language switch is saved", async ({ page }) => {
  await page.goto("/")
  await activeScene(page, "menu")
  await page.keyboard.press("KeyO")
  await activeScene(page, "settings")
  // Language: 4th item (sound, music, effects, language)
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowDown")
    await page.waitForTimeout(80)
  }
  await page.keyboard.press("Enter")
  await expect.poll(() => inGame(page, (w) => w.save.get().settings.lang)).toBe("ru")
})

test("replay: a recorded run plays back the same way", async ({ page }) => {
  await page.goto("/")
  await activeScene(page, "menu")
  await page.evaluate(() => (window as unknown as GameWindow).game.scene.getScene("menu").scene.start("game"))
  await activeScene(page, "game")
  await page.waitForTimeout(500)
  const playerX = () =>
    page.evaluate(
      () =>
        ((window as unknown as GameWindow).game.scene.getScene("game") as unknown as { player: { x: number } }).player
          .x,
    )

  // Record: run right for a while from the level start
  await page.evaluate(() => {
    const w = window as unknown as GameWindow
    w.replay.startRecording(0)
    w.game.scene.getScene("game").scene.restart({ level: 0 })
  })
  // Input through the HUD touch buttons: steady in a headless browser, where a held key may drop
  const touch = (action: "press" | "release") =>
    page.evaluate((a) => {
      const hud = (window as unknown as GameWindow).game.scene.getScene("hud") as unknown as {
        touch: { press(x: string): void; release(x: string): void }
      }
      hud.touch[a]("right")
    }, action)
  await page.waitForTimeout(400)
  await touch("press")
  await page.waitForTimeout(800)
  await touch("release")
  await page.waitForTimeout(300)
  const recordedX = await playerX()
  const changes = await page.evaluate(() => {
    const w = window as unknown as GameWindow
    const data = w.replay.stopRecording()!
    w.replay.startPlayback(data)
    w.game.scene.getScene("game").scene.restart({ level: 0 })
    return data.events.length
  })
  // Nothing pressed → right held → released
  expect(changes).toBeGreaterThanOrEqual(3)
  // Play back with no keys pressed: the player runs by the recording
  await page.waitForFunction(() => !(window as unknown as GameWindow).replay.isPlaying, null, { timeout: 10_000 })
  expect(Math.abs((await playerX()) - recordedX)).toBeLessThan(16)
})

test("accessibility: help, game speed, colours and sound captions", async ({ page }) => {
  await page.goto("/")
  await activeScene(page, "menu")
  await page.evaluate(() =>
    (window as unknown as GameWindow).save.update({
      settings: { assist: true, gameSpeed: 0.6, colors: "deutan", captions: true },
    }),
  )
  await page.evaluate(() => (window as unknown as GameWindow).game.scene.getScene("menu").scene.start("game"))
  await activeScene(page, "hud")
  // Help: two more lives; speed: the world runs at 60%
  expect(await inGame(page, (w) => w.game.registry.get("lives"))).toBe(5)
  const timeScale = await page.evaluate(
    () =>
      (
        (window as unknown as GameWindow).game.scene.getScene("game") as unknown as {
          physics: { world: { timeScale: number } }
        }
      ).physics.world.timeScale,
  )
  expect(timeScale).toBeCloseTo(1 / 0.6)
  // Captions: a jump shows "[прыжок]"
  await page.waitForTimeout(500)
  await page.keyboard.press("Space")
  await expect
    .poll(() =>
      page.evaluate(() => {
        const hud = (window as unknown as GameWindow).game.scene.getScene("hud")
        return hud.children.list
          .filter((o) => o.type === "Text")
          .map((o) => o as unknown as { text: string; alpha: number })
          .some((o) => o.text.includes("[") && o.alpha > 0)
      }),
    )
    .toBe(true)
  // Pause → "Skip level" (6th item) opens level 2 without stars
  await page.keyboard.press("Escape")
  await activeScene(page, "pause")
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("ArrowDown")
    await page.waitForTimeout(60)
  }
  await page.keyboard.press("Enter")
  await activeScene(page, "levels")
  const progress = await inGame(page, (w) => w.save.get().levels)
  expect(progress.level1).toEqual({ stars: 0, best: 0 })
})
