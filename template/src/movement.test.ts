import { describe, expect, it } from "vitest"

import { approach, pickPlayerState, START_MOVE, stepMovement, type MoveTuning } from "./movement"

const T: MoveTuning = {
  speed: 100,
  accel: 1000,
  decel: 2000,
  airControl: 0.5,
  jumpSpeed: 400,
  jumpCut: 0.5,
  coyoteMs: 100,
  bufferMs: 100,
  fallGravity: 2,
  maxFall: 500,
}
const idle = { x: 0, jumpHeld: false, jumpPressed: false }
const ground = { vx: 0, vy: 0, onFloor: true }
const air = { vx: 0, vy: 50, onFloor: false }

describe("approach", () => {
  it("moves towards the target without overshooting", () => {
    expect(approach(0, 10, 3)).toBe(3)
    expect(approach(9, 10, 3)).toBe(10)
    expect(approach(0, -10, 3)).toBe(-3)
  })
})

describe("stepMovement: running", () => {
  it("speeds up gradually and stops at top speed", () => {
    const r = stepMovement(START_MOVE, { ...idle, x: 1 }, ground, 50, T)
    expect(r.vx).toBe(50)
    expect(stepMovement(START_MOVE, { ...idle, x: 1 }, { ...ground, vx: 90 }, 50, T).vx).toBe(100)
  })

  it("has less control in the air", () => {
    expect(stepMovement(START_MOVE, { ...idle, x: 1 }, air, 50, T).vx).toBe(25)
  })
})

describe("stepMovement: jumping", () => {
  it("jumps from the ground", () => {
    const r = stepMovement(START_MOVE, { ...idle, jumpHeld: true, jumpPressed: true }, ground, 16, T)
    expect(r.jumped).toBe(true)
    expect(r.vy).toBe(-400)
  })

  it("coyote time: jumps shortly after leaving the ledge, not later", () => {
    const left = stepMovement(START_MOVE, idle, ground, 16, T).state
    const soon = stepMovement(left, { ...idle, jumpPressed: true }, air, 60, T)
    expect(soon.jumped).toBe(true)
    const late = stepMovement(left, { ...idle, jumpPressed: true }, air, 150, T)
    expect(late.jumped).toBe(false)
  })

  it("jump buffer: a press just before landing jumps on landing", () => {
    const pressed = stepMovement(START_MOVE, { ...idle, jumpHeld: true, jumpPressed: true }, air, 16, T)
    expect(pressed.jumped).toBe(false)
    const landed = stepMovement(pressed.state, { ...idle, jumpHeld: true }, ground, 50, T)
    expect(landed.jumped).toBe(true)
  })

  it("releasing jump early cuts the jump once", () => {
    const up = stepMovement(START_MOVE, { ...idle, jumpHeld: true, jumpPressed: true }, ground, 16, T)
    const cut = stepMovement(up.state, idle, { vx: 0, vy: -300, onFloor: false }, 16, T)
    expect(cut.vy).toBe(-150)
    const after = stepMovement(cut.state, idle, { vx: 0, vy: -140, onFloor: false }, 16, T)
    expect(after.vy).toBe(-140)
  })

  it("falls with heavier gravity and a speed limit", () => {
    const r = stepMovement(START_MOVE, idle, { vx: 0, vy: 900, onFloor: false }, 16, T)
    expect(r.gravityScale).toBe(2)
    expect(r.vy).toBe(500)
    expect(stepMovement(START_MOVE, idle, { vx: 0, vy: -100, onFloor: false }, 16, T).gravityScale).toBe(1)
  })
})

describe("pickPlayerState", () => {
  it("tells idle, run, jump and fall apart", () => {
    expect(pickPlayerState({ vx: 0, vy: 0, onFloor: true })).toBe("idle")
    expect(pickPlayerState({ vx: 120, vy: 0, onFloor: true })).toBe("run")
    expect(pickPlayerState({ vx: 0, vy: -200, onFloor: false })).toBe("jump")
    expect(pickPlayerState({ vx: 0, vy: 200, onFloor: false })).toBe("fall")
  })
})
