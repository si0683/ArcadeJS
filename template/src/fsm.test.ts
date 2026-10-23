import { describe, expect, it, vi } from "vitest"

import { StateMachine } from "./fsm"

describe("StateMachine", () => {
  it("calls exit and enter once per real change", () => {
    const enterJump = vi.fn()
    const exitIdle = vi.fn()
    const fsm = new StateMachine<"idle" | "jump">({ idle: { exit: exitIdle }, jump: { enter: enterJump } })
    expect(fsm.set("idle")).toBe(true)
    expect(fsm.set("idle")).toBe(false)
    fsm.set("jump")
    expect(exitIdle).toHaveBeenCalledWith("jump")
    expect(enterJump).toHaveBeenCalledWith("idle")
    expect(fsm.is("jump", "idle")).toBe(true)
  })

  it("counts time in the current state and runs its update", () => {
    const update = vi.fn()
    const fsm = new StateMachine<"run">({ run: { update } })
    fsm.set("run")
    fsm.update(16)
    fsm.update(16)
    expect(fsm.elapsed).toBe(32)
    expect(update).toHaveBeenCalledTimes(2)
    fsm.set("run")
    expect(fsm.elapsed).toBe(32)
  })
})
