import { describe, expect, it } from "vitest"

import { decodeInput, encodeInput, parseReplay, replay } from "./replay"

describe("replay", () => {
  it("packs the input into numbers and back", () => {
    const [bits, axis] = encodeInput(["right", "jump"], 0.5)
    expect(decodeInput(bits, axis)).toEqual({ down: new Set(["right", "jump"]), axisX: 0.5 })
  })

  it("stores only changes with their game time and plays them back by time", () => {
    replay.startRecording(1)
    replay.record(["left"], -1, 1000) // the clock starts here: t = 0
    replay.record(["left"], -1, 1100) // no change — not stored
    replay.record([], 0, 1200) // t = 200
    replay.record([], 0, 1300)
    const data = replay.stopRecording()!
    expect(data.events).toEqual([
      [0, 1, -100],
      [200, 0, 0],
    ])
    expect(data.duration).toBe(300)

    replay.startPlayback(data)
    expect(replay.next(5000)?.axisX).toBe(-1)
    expect(replay.next(5150)?.axisX).toBe(-1)
    expect(replay.next(5250)?.down.size).toBe(0)
    expect(replay.next(5350)).toBeUndefined()
    expect(replay.isPlaying).toBe(false)
  })

  it("rejects files that are not replays", () => {
    expect(parseReplay("{}")).toBeUndefined()
    expect(parseReplay("nope")).toBeUndefined()
    expect(
      parseReplay(JSON.stringify({ version: 2, level: 0, duration: 10, events: [[0, 1, 0]] }))?.events,
    ).toHaveLength(1)
  })
})
