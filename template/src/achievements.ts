import type { Key } from "./i18n"
import { LEVELS, totalStars } from "./levels"
import type { Save } from "./save"

// Achievements: a list of ids with a check over the game's numbers. checkAchievements() is a plain
// function (tested); the scenes call unlockAchievements() from src/toast.ts to save and show them.
// A new one: add it here with a title in i18n.ts.

export interface Achievement {
  id: string
  title: Key
}

/** What happened in the run that just ended */
export interface RunStats {
  won: boolean
  /** Lives lost during the level */
  damage: number
}

export const ACHIEVEMENTS: (Achievement & { check: (save: Save, run: RunStats) => boolean })[] = [
  { id: "first_win", title: "achFirstWin", check: (_save, run) => run.won },
  { id: "no_damage", title: "achNoDamage", check: (_save, run) => run.won && run.damage === 0 },
  { id: "coins_100", title: "achCoins100", check: (save) => save.wallet >= 100 },
  { id: "all_stars", title: "achAllStars", check: (save) => totalStars(save.levels) >= LEVELS.length * 3 },
]

/** Ids that the player has just earned (not unlocked before) */
export function checkAchievements(save: Save, run: RunStats): string[] {
  return ACHIEVEMENTS.filter((a) => !save.achievements.includes(a.id) && a.check(save, run)).map((a) => a.id)
}

export function achievementTitle(id: string): Key | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)?.title
}
