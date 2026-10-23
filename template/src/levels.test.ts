import { describe, expect, it } from "vitest"

import { isUnlocked, LEVELS, parseProgress, recordResult, starsFor, totalStars } from "./levels"

describe("starsFor", () => {
  it("gives 1 for finishing, 2 for two thirds of the coins, 3 for all", () => {
    expect(starsFor(0, 15)).toBe(1)
    expect(starsFor(9, 15)).toBe(1)
    expect(starsFor(10, 15)).toBe(2)
    expect(starsFor(15, 15)).toBe(3)
    expect(starsFor(0, 0)).toBe(3)
  })
})

describe("progress", () => {
  it("opens the first level, the next one after finishing the previous", () => {
    expect(isUnlocked({}, 0)).toBe(true)
    expect(isUnlocked({}, 1)).toBe(false)
    expect(isUnlocked({ [LEVELS[0].key]: { stars: 1, best: 3 } }, 1)).toBe(true)
    // Skipped with help (settings → accessibility): no stars, but the way on is open
    expect(isUnlocked({ [LEVELS[0].key]: { stars: 0, best: 0 } }, 1)).toBe(true)
  })

  it("keeps the best stars and score", () => {
    let p = recordResult({}, "level1", 2, 10)
    p = recordResult(p, "level1", 1, 20)
    expect(p.level1).toEqual({ stars: 2, best: 20 })
    expect(totalStars(p)).toBe(2)
  })

  it("reads broken data safely", () => {
    expect(parseProgress(null)).toEqual({})
    expect(parseProgress({ level1: { stars: 9, best: -4 }, unknown: { stars: 3 } })).toEqual({
      level1: { stars: 3, best: 0 },
    })
  })
})
