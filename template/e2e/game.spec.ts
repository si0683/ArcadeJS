import { expect, test, type Page } from "@playwright/test"

import { mockPlatformSdk, platformName, sdkCalls } from "./sdk-mock"

// Smoke check of the real game in a browser: it loads without errors, the menu works,
// the level starts and the player moves. Add a check here for every new core mechanic.

type GameWindow = Window & {
  game: import("phaser").Game
  save: typeof import("../src/save").save
}

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
  expect(await page.evaluate(() => (window as unknown as GameWindow).save.get().settings.music)).toBe(0.75)
  expect(await page.evaluate(() => (window as unknown as GameWindow).game.scene.isActive("menu"))).toBe(true)

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
  if ((await platformName(page)) !== "none") {
    expect(await sdkCalls(page)).toEqual(expect.arrayContaining(["ready", "gameplayStart"]))
  }

  expect(errors).toEqual([])
})
