import { describe, expect, it } from "vitest"

import { parseDeaths } from "./heatmap"

describe("death heat map files", () => {
  const death = { level: 1, x: 120, y: 200, cause: "hazard" }

  it("reads telemetry events and keeps only deaths", () => {
    const events = [
      { name: "death", data: death, time: 10 },
      { name: "level_start", data: { level: 1 }, time: 0 },
    ]
    expect(parseDeaths(events)).toEqual([death])
  })

  it("reads plain lists and the game server's export", () => {
    expect(parseDeaths([death])).toEqual([death])
    expect(parseDeaths({ deaths: [death, { level: 1, x: "bad" }] })).toEqual([death])
  })

  it("ignores anything else", () => {
    expect(parseDeaths(null)).toEqual([])
    expect(parseDeaths({ hello: 1 })).toEqual([])
  })
})
