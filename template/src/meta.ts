import type Phaser from "phaser"

import { achievementTitle, checkAchievements, type RunStats } from "./achievements"
import { FEATURES } from "./config"
import { claimDaily } from "./daily"
import { fmt, t } from "./i18n"
import { save } from "./save"
import { track } from "./telemetry"

// Meta game around the levels: achievements, daily reward, pop-up messages.
// Pop-ups are drawn by ToastScene, which runs above every other scene for the whole game.

/** Pop-ups sent before ToastScene started listening; it shows them when it starts */
export const pendingToasts: [string, string][] = []

/** A pop-up at the top of the screen; survives scene changes */
export function toast(game: Phaser.Game, title: string, text = "") {
  if (!game.events.emit("toast", title, text)) pendingToasts.push([title, text])
}

/** Checks the achievements after a run, saves the new ones and shows them */
export function unlockAchievements(game: Phaser.Game, run: RunStats): string[] {
  if (!FEATURES.achievements) return []
  const earned = checkAchievements(save.get(), run)
  if (earned.length === 0) return []
  save.update({ achievements: [...save.get().achievements, ...earned] })
  for (const id of earned) {
    const title = achievementTitle(id)
    toast(game, t("achievement"), title ? t(title) : id)
    track("achievement", { id })
  }
  return earned
}

/** Gives today's reward once a day (called when the menu opens) */
export function claimDailyReward(game: Phaser.Game) {
  if (!FEATURES.dailyReward) return
  const reward = claimDaily(save.get().daily, new Date())
  if (!reward) return
  save.update({ wallet: save.get().wallet + reward.coins, daily: reward.daily })
  toast(game, t("daily"), fmt("dailyText", { n: reward.daily.streak, m: reward.coins }))
  track("daily_reward", { day: reward.daily.streak, coins: reward.coins })
  unlockAchievements(game, { won: false, damage: 0 })
}
