import { describe, expect, it } from "vitest"

import { START_TOPDOWN, stepTopDown, type TopDownTuning } from "./topdown"

const T: TopDownTuning = { speed: 100, accel: 1000, friction: 2000, dashSpeed: 300, dashMs: 100, dashCooldownMs: 500 }
const still = { vx: 0, vy: 0 }

describe("stepTopDown", () => {
  it("walks with acceleration up to the top speed", () => {
    expect(stepTopDown(START_TOPDOWN, { x: 1, y: 0, dashPressed: false }, still, 50, T).vx).toBe(50)
    expect(stepTopDown(START_TOPDOWN, { x: 1, y: 0, dashPressed: false }, { vx: 95, vy: 0 }, 50, T).vx).toBe(100)
  })

  it("is not faster on diagonals", () => {
    const r = stepTopDown(START_TOPDOWN, { x: 1, y: 1, dashPressed: false }, { vx: 70, vy: 70 }, 100, T)
    expect(Math.hypot(r.vx, r.vy)).toBeCloseTo(100, 0)
  })

  it("stops with friction when nothing is pressed", () => {
    expect(stepTopDown(START_TOPDOWN, { x: 0, y: 0, dashPressed: false }, { vx: 100, vy: 0 }, 50, T).vx).toBe(0)
  })

  it("dashes where the hero faces, then waits for the cooldown", () => {
    const walk = stepTopDown(START_TOPDOWN, { x: 0, y: -1, dashPressed: false }, still, 16, T)
    const dash = stepTopDown(walk.state, { x: 0, y: 0, dashPressed: true }, still, 16, T)
    expect(dash.dashed).toBe(true)
    expect(dash.vy).toBe(-300)
    expect(dash.state.dash).toBe(100)
    const again = stepTopDown({ ...dash.state, dash: 0 }, { x: 0, y: 0, dashPressed: true }, still, 16, T)
    expect(again.dashed).toBe(false)
  })
})
