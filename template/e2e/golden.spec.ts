import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { expect, test, type Page } from "@playwright/test"

import { mockPlatformSdk } from "./sdk-mock"

// Golden runs: recorded input (e2e/golden/*.replay.json, made with F7 in npm run dev) is played back
// frame by frame with a fixed 1/60 s step, so the run is exactly the same on every machine. The end
// state — position, score, lives, win — is compared with <name>.<genre>.expected.json. A change in
// physics, movement numbers or a level map shows up here even when nothing looks broken.
// The first run of a new replay saves its expected file (commit it); after an intended change of the
// balance: npm run test:golden -- --update-snapshots, or delete the expected file.
//
// The same machinery re-runs a leaderboard record from the game server: npm run verify -- <replay.json> [score]

const DIR = join("e2e", "golden")
const STEP = 1000 / 60

export interface RunResult {
  x: number
  y: number
  score: number
  lives: number
  finished: boolean
}

type Replay = { version: number; level: number; duration: number; events: number[][] }

/** Plays a replay with the game loop driven by hand: no requestAnimationFrame, no timing noise */
export async function simulate(page: Page, replay: Replay): Promise<RunResult> {
  await page.goto("/")
  await page.waitForFunction(() =>
    (window as unknown as { game?: { scene: { isActive(k: string): boolean } } }).game?.scene.isActive("menu"),
  )
  return page.evaluate(
    async ({ data, step }) => {
      type Scene = { scene: { key: string; stop(): void }; finished?: boolean; player: { x: number; y: number } }
      const w = window as unknown as {
        game: {
          loop: { sleep(): void; wake(): void; delta: number }
          headlessStep(time: number, delta: number): void
          scene: {
            getScenes(active: boolean): Scene[]
            start(key: string, data: object): void
            isActive(key: string): boolean
            getScene(key: string): Scene
          }
          registry: { get(key: string): number }
        }
        replay: { startPlayback(r: unknown): void; isPlaying: boolean }
      }
      const { game, replay } = w
      game.loop.sleep()
      // Frames from a fixed zero with the same floating-point step every run (the physics counts its
      // fixed steps from them), updated without drawing — a 5-second run takes a fraction of a second
      let time = 0
      // Phaser's tweens run on Date.now(), and a tween (the landing squash) changes the body size:
      // the wall clock follows the simulated one too
      const realNow = Date.now
      const epoch = 1_700_000_000_000
      Date.now = () => epoch + time
      const frame = () => {
        time += step
        // Controls read the frame time from the loop
        game.loop.delta = step
        game.headlessStep(time, step)
      }
      const idle = () => new Promise((resolve) => setTimeout(resolve, 2))
      for (const s of game.scene.getScenes(true)) if (s.scene.key !== "toast") s.scene.stop()
      replay.startPlayback(data)
      game.scene.start("game", { level: data.level })
      // The map loads over the network: keep stepping until the level runs
      for (let i = 0; i < 2000 && !game.scene.isActive("game"); i++) {
        frame()
        await idle()
      }
      const scene = game.scene.getScene("game")
      let frames = 0
      while ((replay.isPlaying || frames === 0) && !scene.finished && frames < 60 * 300) {
        frame()
        frames++
      }
      // Let the last jump land
      for (let i = 0; i < 30 && !scene.finished; i++) frame()
      const round = (v: number) => Math.round(v * 100) / 100
      const result = {
        x: round(scene.player.x),
        y: round(scene.player.y),
        score: game.registry.get("score"),
        lives: game.registry.get("lives"),
        finished: !!scene.finished,
      }
      Date.now = realNow
      game.loop.wake()
      return result
    },
    { data: replay, step: STEP },
  )
}

test.beforeEach(({ page }) => mockPlatformSdk(page))

const replays = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith(".replay.json")) : []

for (const file of replays) {
  test(`@golden ${file} ends exactly as recorded`, async ({ page }, info) => {
    const replay = JSON.parse(readFileSync(join(DIR, file), "utf8")) as Replay
    const result = await simulate(page, replay)
    // Two runs in one browser must match: otherwise something in the game is not deterministic
    expect(await simulate(page, replay), "the same input gave a different run").toEqual(result)
    const genre = await page.evaluate(() =>
      (window as unknown as { game: { registry: { get(k: string): string } } }).game.registry.get("genre"),
    )
    const expectedFile = join(DIR, file.replace(".replay.json", `.${genre}.expected.json`))
    if (!existsSync(expectedFile) || info.config.updateSnapshots === "all") {
      writeFileSync(expectedFile, JSON.stringify(result, null, 2) + "\n")
      console.log(`[golden] saved ${expectedFile}: ${JSON.stringify(result)}`)
      return
    }
    expect(result).toEqual(JSON.parse(readFileSync(expectedFile, "utf8")))
  })
}

// npm run verify -- <replay.json> [claimed score]: replays a record from the game server's data
test("@verify a replay from a file", async ({ page }) => {
  const file = process.env.VERIFY_REPLAY
  test.skip(!file, "npm run verify -- <replay.json> [score]")
  const replay = JSON.parse(readFileSync(file!, "utf8")) as Replay
  const result = await simulate(page, replay)
  console.log(
    `[verify] ${file}: level ${replay.level + 1}, score ${result.score}, ${result.finished ? "finished" : "not finished"}, ${(replay.duration / 1000).toFixed(1)} s`,
  )
  const claimed = process.env.VERIFY_SCORE
  if (claimed)
    expect(result.score, "the replay does not reach the claimed score").toBeGreaterThanOrEqual(Number(claimed))
})
