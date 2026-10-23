import { describe, expect, it } from "vitest"

import { createRandom } from "./random"

describe("seeded random", () => {
  it("the same seed repeats the same sequence", () => {
    const a = createRandom(42)
    const b = createRandom(42)
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()))
  })

  it("stays in range", () => {
    const r = createRandom(7)
    for (let i = 0; i < 1000; i++) {
      const n = r.int(1, 6)
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(6)
    }
  })

  it("re-seeding starts over", () => {
    const r = createRandom(3)
    const first = r.next()
    r.next()
    r.seed(3)
    expect(r.next()).toBe(first)
  })
})
