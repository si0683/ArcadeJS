import { describe, expect, it } from "vitest"

import { assigned, pickVariant, runExperiments, variant } from "./experiments"

describe("experiments", () => {
  it("a player always gets the same variant", () => {
    expect(pickVariant("player-1", "jump", ["a", "b"])).toBe(pickVariant("player-1", "jump", ["a", "b"]))
  })

  it("players split about evenly", () => {
    const counts = { a: 0, b: 0 }
    for (let i = 0; i < 2000; i++) counts[pickVariant(`p${i}`, "jump", ["a", "b"]) as "a" | "b"]++
    expect(counts.a).toBeGreaterThan(850)
    expect(counts.b).toBeGreaterThan(850)
  })

  it("different experiments split independently", () => {
    let same = 0
    for (let i = 0; i < 1000; i++) {
      if (pickVariant(`p${i}`, "jump", ["a", "b"]) === pickVariant(`p${i}`, "menu", ["a", "b"])) same++
    }
    expect(same).toBeGreaterThan(400)
    expect(same).toBeLessThan(600)
  })

  it("remote experiments apply the overrides of the player's variant", () => {
    const applied: unknown[] = []
    const json = { jump: { a: {}, b: { PLAYER: { jumpSpeed: 430 } } } }
    const result = runExperiments(json, (o) => applied.push(o), "player-7")
    const expected = pickVariant("player-7", "jump", ["a", "b"])
    expect(result).toEqual({ jump: expected })
    expect(applied).toEqual([json.jump[expected as "a" | "b"]])
    expect(assigned.jump).toBe(expected)
  })

  it("code experiments remember the variant", () => {
    const first = variant("layout", ["a", "b", "c"], "player-3")
    expect(variant("layout", ["a", "b", "c"], "someone-else")).toBe(first)
  })
})
