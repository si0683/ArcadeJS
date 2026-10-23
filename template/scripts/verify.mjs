// Re-runs a leaderboard record from the game server: the replay is played frame by frame in the real
// game (e2e/golden.spec.ts → simulate) and the score it reaches is compared with the claimed one.
//   npm run verify -- server/data/replays/1/<player>.json        prints what the replay achieves
//   npm run verify -- server/data/replays/1/<player>.json 25     fails if it does not reach 25
// A record whose replay cannot reach its score was not played with this game: remove it from scores.json.
import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

const [file, score] = process.argv.slice(2)
if (!file || !existsSync(file)) {
  console.error("Usage: npm run verify -- <replay.json> [claimed score]")
  process.exit(1)
}
const result = spawnSync(
  "npx",
  ["playwright", "test", "e2e/golden.spec.ts", "--project=chromium", "-g", "@verify", "--reporter=line"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, VERIFY_REPLAY: resolve(file), VERIFY_SCORE: score ?? "" },
  },
)
process.exit(result.status ?? 1)
