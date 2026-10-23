import { describe, expect, it } from "vitest"

import { checkAchievements } from "./achievements"
import { claimDaily, dayKey } from "./daily"
import { applyOverrides } from "./remote"
import { DEFAULT_SAVE } from "./save"

describe("achievements", () => {
  it("unlocks only new ones that match", () => {
    expect(checkAchievements(DEFAULT_SAVE, { won: true, damage: 1 })).toEqual(["first_win"])
    expect(checkAchievements(DEFAULT_SAVE, { won: true, damage: 0 })).toEqual(["first_win", "no_damage"])
    const later = { ...DEFAULT_SAVE, achievements: ["first_win"], wallet: 150 }
    expect(checkAchievements(later, { won: false, damage: 2 })).toEqual(["coins_100"])
  })
})

describe("daily reward", () => {
  const day = (d: number) => new Date(2026, 9, d, 12)

  it("grows with the streak and resets after a missed day", () => {
    const first = claimDaily({ last: "", streak: 0 }, day(1))!
    expect(first).toEqual({ coins: 10, daily: { last: "2026-10-01", streak: 1 } })
    const second = claimDaily(first.daily, day(2))!
    expect(second.coins).toBe(20)
    expect(claimDaily(second.daily, day(2))).toBeNull()
    expect(claimDaily(second.daily, day(5))!.daily.streak).toBe(1)
  })

  it("caps at day 7 and uses the local date", () => {
    expect(claimDaily({ last: "2026-10-09", streak: 9 }, day(10))!.coins).toBe(70)
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05")
  })
})

describe("remote config", () => {
  it("changes only known numbers", () => {
    const sections = { PLAYER: { speed: 100, name: "x" } as Record<string, unknown> }
    const changed = applyOverrides({ PLAYER: { speed: 150, name: "y", extra: 1 }, HACK: { a: 1 } }, sections)
    expect(changed).toBe(1)
    expect(sections.PLAYER).toEqual({ speed: 150, name: "x" })
    expect(applyOverrides("garbage", sections)).toBe(0)
  })
})
