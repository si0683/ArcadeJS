import { expect, test } from "@playwright/test"

import { mockPlatformSdk } from "./sdk-mock"

// Performance under load: the CPU is slowed down 4× (like a budget phone) and the game must keep
// a playable frame rate on the busiest level. Run separately: npm run test:perf
// The number depends on the machine and the GPU of the test browser; tune MIN_FPS for your CI.

const MIN_FPS = Number(process.env.MIN_FPS ?? 30)
const SLOWDOWN = 4

type GameWindow = Window & { game: import("phaser").Game }

test.beforeEach(({ page }) => mockPlatformSdk(page))

test("@perf the busiest level keeps the frame rate on a slow CPU", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page)
  await page.goto("/")
  await page.waitForFunction(() => (window as unknown as GameWindow).game?.scene.isActive("menu"))
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: SLOWDOWN })
  // The last level has the most objects
  await page.evaluate(() => {
    const game = (window as unknown as GameWindow).game
    game.scene.getScene("menu").scene.start("game", { level: 1 })
  })
  await page.waitForFunction(() => (window as unknown as GameWindow).game.scene.isActive("game"))
  await page.keyboard.down("ArrowRight")
  const samples: number[] = []
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(400)
    samples.push(await page.evaluate(() => (window as unknown as GameWindow).game.loop.actualFps))
  }
  await page.keyboard.up("ArrowRight")
  const average = samples.reduce((a, b) => a + b, 0) / samples.length
  console.log(`FPS with ${SLOWDOWN}× slower CPU: ${average.toFixed(1)} (min ${MIN_FPS})`)
  expect(average).toBeGreaterThanOrEqual(MIN_FPS)
})
