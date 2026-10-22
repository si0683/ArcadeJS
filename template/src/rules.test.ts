import { describe, expect, it } from "vitest"

import { isRecord, isStomp, loseLife } from "./rules"

describe("isStomp", () => {
  it("falling onto the enemy from above squashes it", () => {
    expect(isStomp(200, 90, 100)).toBe(true)
  })

  it("running into the enemy from the side hurts the player", () => {
    expect(isStomp(0, 100, 100)).toBe(false)
    expect(isStomp(200, 98, 100)).toBe(false)
  })

  it("jumping up into the enemy is not a stomp", () => {
    expect(isStomp(-300, 80, 100)).toBe(false)
  })
})

describe("isRecord", () => {
  it("only a higher score is a record", () => {
    expect(isRecord(5, 0)).toBe(true)
    expect(isRecord(5, 5)).toBe(false)
    expect(isRecord(4, 5)).toBe(false)
  })
})

describe("loseLife", () => {
  it("counts lives down to game over", () => {
    expect(loseLife(3)).toEqual({ lives: 2, gameOver: false })
    expect(loseLife(1)).toEqual({ lives: 0, gameOver: true })
    expect(loseLife(0)).toEqual({ lives: 0, gameOver: true })
  })
})
