import { describe, expect, it, vi } from "vitest"

import { addSink, recent, track } from "./telemetry"

describe("track", () => {
  it("sends events to every sink and keeps the latest ones", () => {
    const sink = vi.fn()
    addSink(sink)
    track("level_complete", { score: 12 })
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({ name: "level_complete", data: { score: 12 } }))
    expect(recent.at(-1)?.name).toBe("level_complete")
  })

  it("a failing sink does not break the game", () => {
    addSink(() => {
      throw new Error("analytics is down")
    })
    expect(() => track("death")).not.toThrow()
  })

  it("keeps at most 30 recent events", () => {
    for (let i = 0; i < 40; i++) track("tick")
    expect(recent.length).toBe(30)
  })
})
