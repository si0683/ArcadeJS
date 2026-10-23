import type { Daily } from "./save"

// Daily reward: come back every day for a bigger bonus (day 1 — 10 coins … day 7 and on — 70).
// Missing a day starts the streak over. Plain functions, tested in daily.test.ts.

export const DAILY_BASE = 10
export const DAILY_MAX_DAY = 7

/** Local date as "YYYY-MM-DD" (the player's day, not UTC) */
export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The reward for today, or null if it was already taken */
export function claimDaily(daily: Daily, now: Date): { coins: number; daily: Daily } | null {
  const today = dayKey(now)
  if (daily.last === today) return null
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
  const streak = daily.last === yesterday ? daily.streak + 1 : 1
  return { coins: DAILY_BASE * Math.min(streak, DAILY_MAX_DAY), daily: { last: today, streak } }
}
