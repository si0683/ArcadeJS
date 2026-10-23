import { playerId } from "./player"
import { track } from "./telemetry"

// A/B tests: players are split into stable groups by their anonymous id (src/player.ts), every group
// gets its own balance or behaviour, and analytics compares them (the game server's report groups
// level completion by variant). Two ways to run one:
//
// 1. Balance only, no new build — in the remote config file (FEATURES.remoteConfigUrl, src/remote.ts):
//      { "experiments": { "jump": { "a": {}, "b": { "PLAYER": { "jumpSpeed": 430 } } } } }
//    Half of the players get the higher jump; "a" keeps the game as it is.
// 2. In code: `if (variant("menu_layout", ["a", "b"]) === "b") …` — the same player always gets the same.
//
// The group is sent once as an "experiment" event and with every batch to the game server.

/** Experiment → variant of this player */
export const assigned: Record<string, string> = {}

/** FNV-1a + the murmur3 finaliser: a small stable hash, the same in every browser, with well-mixed low bits */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

/** Which variant a player gets: depends only on the id and the experiment name */
export function pickVariant(id: string, name: string, variants: string[]): string {
  return variants[hash(`${name}:${id}`) % variants.length]
}

function assign(name: string, value: string) {
  if (assigned[name] === value) return
  assigned[name] = value
  track("experiment", { name, variant: value })
}

/** A code experiment: the player's variant, the same on every visit */
export function variant(name: string, variants: string[], id = playerId()): string {
  const value = assigned[name] ?? pickVariant(id, name, variants)
  assign(name, value)
  return value
}

/**
 * Experiments from the remote config: picks the player's variant of each and passes its overrides
 * to `apply` (the remote config's applyOverrides). Returns the variants.
 */
export function runExperiments(
  json: unknown,
  apply: (overrides: unknown) => void,
  id = playerId(),
): Record<string, string> {
  if (!json || typeof json !== "object") return {}
  const result: Record<string, string> = {}
  for (const [name, variants] of Object.entries(json as Record<string, unknown>)) {
    if (!variants || typeof variants !== "object") continue
    const names = Object.keys(variants).sort()
    if (names.length === 0) continue
    const value = pickVariant(id, name, names)
    apply((variants as Record<string, unknown>)[value])
    assign(name, value)
    result[name] = value
  }
  return result
}
