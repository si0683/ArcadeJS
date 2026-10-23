// What a fair result on each level can be, computed from the same files the game uses:
// content/levels.json, content/balance.json and the Tiled maps. The leaderboard rejects scores above
// the level's maximum (every coin plus every enemy squashed) and runs faster than the minimum time.
import { readFileSync } from "node:fs"
import { join } from "node:path"

/** A level cannot be finished faster than this, s (raise it for long levels) */
export const MIN_SECONDS = 3

/** Level number (1-based, as in the events) → { key, maxScore, coins } */
export function readLevelLimits(root) {
  const read = (...parts) => JSON.parse(readFileSync(join(root, ...parts), "utf8"))
  const levels = read("content", "levels.json")
  const { POINTS } = read("content", "balance.json")
  const limits = {}
  levels.forEach((level, i) => {
    const map = read("public", "assets", level.file)
    const objects = map.layers.find((l) => l.name === "objects")?.objects ?? []
    const count = (name) => objects.filter((o) => o.name === name).length
    const coins = count("coin")
    limits[i + 1] = { key: level.key, coins, maxScore: coins * POINTS.coin + count("slime") * POINTS.stomp }
  })
  return limits
}
