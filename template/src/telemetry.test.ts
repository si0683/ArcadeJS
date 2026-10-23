import { describe, expect, it, vi } from "vitest"

import { addSink, parseStack, recent, sentrySink, track } from "./telemetry"

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

describe("Sentry reports", () => {
  it("reads Chrome and Firefox stacks, oldest call first", () => {
    const chrome = "Error: boom\n    at hurt (http://x/assets/index.js:10:20)\n    at http://x/assets/index.js:30:5"
    expect(parseStack(chrome).map((f) => [f.function, f.lineno])).toEqual([
      ["?", 30],
      ["hurt", 10],
    ])
    const firefox = "hurt@http://x/assets/index.js:10:20\n@http://x/assets/index.js:30:5"
    expect(parseStack(firefox)[1]).toMatchObject({ function: "hurt", filename: "http://x/assets/index.js", colno: 20 })
  })

  it("posts each error once to the project's envelope address", () => {
    const fetch = vi.fn(() => Promise.resolve(new Response()))
    vi.stubGlobal("fetch", fetch)
    vi.stubGlobal("location", { href: "http://game/" })
    const sink = sentrySink("https://abc123@o1.ingest.sentry.io/4507", { release: "1.0.0" })
    const error = { name: "error", data: { message: "boom", type: "TypeError", stack: "" }, time: 0 }
    sink(error)
    sink(error)
    sink({ name: "level_start", data: {}, time: 0 })
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("https://o1.ingest.sentry.io/api/4507/envelope/?sentry_key=abc123&sentry_version=7")
    const report = JSON.parse(String(init.body).split("\n")[2])
    expect(report).toMatchObject({ release: "1.0.0", exception: { values: [{ type: "TypeError", value: "boom" }] } })
    vi.unstubAllGlobals()
  })
})
