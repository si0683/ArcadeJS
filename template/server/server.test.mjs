import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { createGameServer } from "./index.mjs"
import { readLevelLimits } from "./levels.mjs"
import { buildReport } from "./report.mjs"

// The game server against a temporary data folder: analytics, leaderboard checks, cloud saves.

const TOKEN = "test-admin-token"
const PLAYER = "player-0001"
let server
let base
let data

beforeAll(async () => {
  data = mkdtempSync(join(tmpdir(), "game-server-"))
  server = createGameServer({ root: process.cwd(), dataDir: data, adminToken: TOKEN })
  await new Promise((resolve) => server.listen(0, resolve))
  base = `http://localhost:${server.address().port}`
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  rmSync(data, { recursive: true, force: true })
})

const call = (method, path, body) =>
  fetch(`${base}${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body) })

describe("game server", () => {
  it("knows the levels and their best possible score", () => {
    const limits = readLevelLimits(process.cwd())
    expect(limits[1].coins).toBeGreaterThan(0)
    expect(limits[1].maxScore).toBeGreaterThanOrEqual(limits[1].coins)
  })

  it("stores events and builds the report only for the admin", async () => {
    const events = [
      { name: "level_start", data: { level: 1 }, time: 1 },
      { name: "death", data: { level: 1, cause: "hazard", x: 100, y: 200 }, time: 2 },
      { name: "level_complete", data: { level: 1, seconds: 40 }, time: 3 },
    ]
    expect((await call("POST", "/events", { player: PLAYER, exp: { jump: "b" }, events })).status).toBe(204)
    expect((await call("GET", "/report")).status).toBe(403)
    const report = await (await call("GET", `/report?token=${TOKEN}`)).json()
    expect(report.levels[0]).toMatchObject({ level: 1, players: 1, finished: 1, completion: 1, avgSeconds: 40 })
    expect(report.experiments.jump.b.completes).toBe(1)
    const deaths = await (await call("GET", `/deaths?token=${TOKEN}&level=1`)).json()
    expect(deaths.deaths).toEqual([{ level: 1, x: 100, y: 200, cause: "hazard" }])
    expect((await call("GET", `/report.html?token=${TOKEN}`)).headers.get("content-type")).toMatch(/text\/html/)
  })

  it("rejects impossible scores and ranks the rest", async () => {
    const max = readLevelLimits(process.cwd())[1].maxScore
    expect((await call("POST", "/scores", { player: PLAYER, level: 1, score: max + 1, seconds: 30 })).status).toBe(422)
    expect((await call("POST", "/scores", { player: PLAYER, level: 1, score: 3, seconds: 0.5 })).status).toBe(422)
    expect((await call("POST", "/scores", { player: PLAYER, level: 99, score: 1, seconds: 30 })).status).toBe(400)
    const ok = await call("POST", "/scores", {
      player: PLAYER,
      level: 1,
      score: 5,
      seconds: 30,
      replay: { version: 2 },
    })
    expect(await ok.json()).toEqual({ best: 5, rank: 1 })
    // Too soon after the last one
    expect((await call("POST", "/scores", { player: PLAYER, level: 1, score: 6, seconds: 30 })).status).toBe(429)
    const board = await (await call("GET", `/leaderboard?level=1&player=${PLAYER}`)).json()
    expect(board.top[0]).toMatchObject({ rank: 1, score: 5, you: true })
    expect(board.top[0].name).toMatch(/^#/)
  })

  it("keeps a cloud save behind the player's secret", async () => {
    const secret = "s".repeat(32)
    expect(await (await call("GET", `/save?player=${PLAYER}&secret=${secret}`)).json()).toEqual({ data: null })
    expect((await call("PUT", "/save", { player: PLAYER, secret, data: { best: 7 } })).status).toBe(200)
    const back = await (await call("GET", `/save?player=${PLAYER}&secret=${secret}`)).json()
    expect(back.data).toEqual({ best: 7 })
    expect((await call("GET", `/save?player=${PLAYER}&secret=${"x".repeat(32)}`)).status).toBe(403)
    expect((await call("PUT", "/save", { player: PLAYER, secret: "x".repeat(32), data: {} })).status).toBe(403)
  })
})

describe("analytics report", () => {
  it("counts day-1 retention of a cohort", () => {
    const e = (day, player, name = "level_start") => ({ day, player, name, data: { level: 1 } })
    const events = [e("2026-01-01", "a"), e("2026-01-01", "b"), e("2026-01-02", "a"), e("2026-01-02", "c")]
    const report = buildReport(events, { a: "2026-01-01", b: "2026-01-01", c: "2026-01-02" })
    expect(report.retention[0]).toMatchObject({ day: "2026-01-01", players: 2, d1: 0.5, d7: null })
    expect(report.players).toEqual([
      { day: "2026-01-01", active: 2, new: 2 },
      { day: "2026-01-02", active: 2, new: 1 },
    ])
  })
})
