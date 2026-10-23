import { CAMERA, FEATURES, FX, PLAYER } from "./config"
import { runExperiments } from "./experiments"

// Remote config: change the balance after release without a new build — for tuning and A/B tests.
// Put a JSON file anywhere (your server, GitHub Pages, a portal's remote variables) and set
// FEATURES.remoteConfigUrl. Only numbers of known sections change; anything else is ignored:
//   { "PLAYER": { "jumpSpeed": 420 }, "FX": { "shake": 0.006 } }
// "experiments" in the same file split players into groups with their own overrides (src/experiments.ts):
//   { "experiments": { "jump": { "a": {}, "b": { "PLAYER": { "jumpSpeed": 430 } } } } }

const SECTIONS = { PLAYER, CAMERA, FX } as unknown as Record<string, Record<string, unknown>>

/** Copies known numeric values into `sections`; returns how many changed */
export function applyOverrides(json: unknown, sections: Record<string, Record<string, unknown>> = SECTIONS): number {
  let changed = 0
  if (!json || typeof json !== "object") return 0
  for (const [name, values] of Object.entries(json as Record<string, unknown>)) {
    const target = sections[name]
    if (!target || !values || typeof values !== "object") continue
    for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
      if (typeof target[key] === "number" && typeof value === "number" && Number.isFinite(value)) {
        target[key] = value
        changed++
      }
    }
  }
  return changed
}

/** Loads the remote file before the game starts; a slow or broken server never blocks the game */
export async function loadRemoteConfig(timeout = 3000): Promise<void> {
  if (!FEATURES.remoteConfigUrl) return
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const response = await fetch(FEATURES.remoteConfigUrl, { signal: controller.signal, cache: "no-cache" })
    clearTimeout(timer)
    if (!response.ok) return
    const json = (await response.json()) as Record<string, unknown>
    applyOverrides(json)
    runExperiments(json.experiments, (overrides) => applyOverrides(overrides))
  } catch (error) {
    console.warn("[remote] config not loaded:", error)
  }
}
