import LEVEL_LIST from "../content/levels.json"
import type { Key } from "./i18n"
import type { LevelLight } from "./lighting"

// The list of levels and the player's progress through them. Plain functions — tested in levels.test.ts.
// A new level: draw it in Tiled (copy maps/level1.tmj), add a line to content/levels.json. The map and
// the level's own assets load when the level starts, not at game start, so 50 levels do not slow down
// the first screen. content/validate.ts checks the list: maps exist, layers and objects are named right.

/** A file only this level needs (a boss sprite, its music): loaded with the map */
export interface LevelAsset {
  type: "image" | "spritesheet" | "audio"
  /** Cache key, as in this.add.image(x, y, key) */
  key: string
  /** Path inside public/assets */
  url: string
  /** Spritesheets: frame size, px */
  frameWidth?: number
  frameHeight?: number
}

export interface Level {
  /** Cache key of the map */
  key: string
  /** Path inside public/assets */
  file: string
  /** i18n key of the level name */
  title: Key
  /** Files only this level needs */
  assets?: LevelAsset[]
  /** A dark level lit by dynamic light (src/lighting.ts) */
  light?: LevelLight
}

export const LEVELS = LEVEL_LIST as Level[]

/** Result of one level, kept in the save */
export interface LevelResult {
  /** 0…3 */
  stars: number
  /** Best score on this level */
  best: number
}

export type Progress = Record<string, LevelResult>

/** Stars for a finished level: 1 — reached the flag, 2 — two thirds of the coins, 3 — all coins */
export function starsFor(coins: number, totalCoins: number): number {
  if (totalCoins <= 0 || coins >= totalCoins) return 3
  return coins * 3 >= totalCoins * 2 ? 2 : 1
}

/** The first level is always open; every next one opens when the previous is finished (or skipped with help) */
export function isUnlocked(progress: Progress, index: number): boolean {
  if (index <= 0) return true
  const previous = LEVELS[index - 1]
  return !!previous && progress[previous.key] !== undefined
}

/** Progress after finishing a level: keeps the best stars and the best score */
export function recordResult(progress: Progress, key: string, stars: number, score: number): Progress {
  const old = progress[key] ?? { stars: 0, best: 0 }
  return { ...progress, [key]: { stars: Math.max(old.stars, stars), best: Math.max(old.best, score) } }
}

/** Stars over all levels — for the level select header and achievements */
export function totalStars(progress: Progress): number {
  return LEVELS.reduce((sum, level) => sum + (progress[level.key]?.stars ?? 0), 0)
}

/** Save data (old version, hand-edited) → valid progress */
export function parseProgress(raw: unknown): Progress {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const progress: Progress = {}
  for (const level of LEVELS) {
    const entry = data[level.key]
    if (!entry || typeof entry !== "object") continue
    const { stars, best } = entry as Record<string, unknown>
    const clamp = (v: unknown, max: number) =>
      typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0
    progress[level.key] = { stars: clamp(stars, 3), best: clamp(best, Number.MAX_SAFE_INTEGER) }
  }
  return progress
}
