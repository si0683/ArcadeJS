import { describe, expect, it } from "vitest"

import { CYRILLIC, layoutGlyphs } from "./bitmapFont"

describe("bitmap font layout", () => {
  it("wraps glyphs into rows that fit the texture", () => {
    const { positions, height } = layoutGlyphs([400, 400, 400], 30, 1000, 2)
    expect(positions).toEqual([
      { x: 2, y: 2 },
      { x: 404, y: 2 },
      { x: 2, y: 34 },
    ])
    expect(height).toBe(66)
  })

  it("has the whole Russian alphabet", () => {
    expect(CYRILLIC.length).toBe(66)
  })
})
