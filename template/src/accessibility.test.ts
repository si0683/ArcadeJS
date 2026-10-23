import { describe, expect, it } from "vitest"

import { colorMatrix } from "./accessibility"

/** Applies a 4×5 colour matrix to an RGB colour in 0…1 */
const apply = (m: number[], [r, g, b]: number[]) =>
  [0, 1, 2].map((i) => m[i * 5] * r + m[i * 5 + 1] * g + m[i * 5 + 2] * b + m[i * 5 + 4])

describe("colour modes", () => {
  it("normal changes nothing", () => {
    expect(apply(colorMatrix("normal"), [0.2, 0.5, 0.9])).toEqual([0.2, 0.5, 0.9])
  })

  it("keeps grey grey in every mode", () => {
    for (const mode of ["protan", "deutan", "tritan"] as const) {
      const [r, g, b] = apply(colorMatrix(mode), [0.5, 0.5, 0.5])
      expect(Math.abs(r - 0.5) + Math.abs(g - 0.5) + Math.abs(b - 0.5), mode).toBeLessThan(0.01)
    }
  })

  it("deuteranopia: red and green differ more in blue after the shift", () => {
    const red = apply(colorMatrix("deutan"), [0.8, 0.2, 0.1])
    const green = apply(colorMatrix("deutan"), [0.2, 0.7, 0.1])
    expect(Math.abs(red[2] - green[2])).toBeGreaterThan(0.2)
  })

  it("high contrast pushes dark darker and light lighter", () => {
    const m = colorMatrix("contrast")
    expect(apply(m, [0.2, 0.2, 0.2])[0]).toBeLessThan(0.2)
    expect(apply(m, [0.8, 0.8, 0.8])[0]).toBeGreaterThan(0.8)
  })
})
