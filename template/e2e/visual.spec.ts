import { expect, test, type Page } from "@playwright/test"

import { mockPlatformSdk } from "./sdk-mock"

// Screenshot tests: static screens are compared with their saved picture, so a change that breaks
// the interface (a shifted button, a missing text) fails the check. The first run on a machine saves
// the pictures (e2e/visual.spec.ts-snapshots/, per OS — fonts differ); commit them. After an intended
// change of the look: npm run test:e2e -- --update-snapshots

type GameWindow = Window & { game: import("phaser").Game; save: typeof import("../src/save").save }

const open = async (page: Page, key: string) => {
  // Fixed state: no daily reward pop-up, Russian texts, nothing unlocked
  await page.addInitScript(() => {
    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const day = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    localStorage.setItem("my-game-save", JSON.stringify({ daily: { last: day, streak: 1 }, settings: { lang: "ru" } }))
  })
  await page.goto("/")
  await page.waitForFunction(() => (window as unknown as GameWindow).game?.scene.isActive("menu"))
  await page.evaluate((k) => (window as unknown as GameWindow).game.scene.getScene("menu").scene.start(k), key)
  await page.waitForFunction((k) => (window as unknown as GameWindow).game.scene.isActive(k), key)
  // Let the fade-in finish
  await page.waitForTimeout(600)
}

test.beforeEach(({ page }) => mockPlatformSdk(page))

for (const screen of ["levels", "settings"]) {
  test(`screen "${screen}" looks as saved`, async ({ page }) => {
    await open(page, screen)
    await expect(page.locator("canvas")).toHaveScreenshot(`${screen}.png`, { maxDiffPixelRatio: 0.01 })
  })
}
