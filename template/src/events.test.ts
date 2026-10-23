import { describe, expect, it, vi } from "vitest"

import { createEvents } from "./events"

describe("game events", () => {
  it("delivers an event to every listener until it stops listening", () => {
    const events = createEvents<{ death: { cause: string } }>()
    const a = vi.fn()
    const b = vi.fn()
    const offA = events.on("death", a)
    events.on("death", b)
    events.emit("death", { cause: "fall" })
    offA()
    events.emit("death", { cause: "slime" })
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenLastCalledWith({ cause: "slime" })
  })

  it("a failing listener does not stop the others", () => {
    const events = createEvents<{ coin: number }>()
    const after = vi.fn()
    vi.spyOn(console, "error").mockImplementation(() => {})
    events.on("coin", () => {
      throw new Error("broken")
    })
    events.on("coin", after)
    events.emit("coin", 1)
    expect(after).toHaveBeenCalledWith(1)
  })
})
