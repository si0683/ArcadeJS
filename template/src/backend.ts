import { assigned } from "./experiments"
import type { Platform, SaveData } from "./platform"
import { playerId, randomId, sessionId, setPlayerId } from "./player"
import { replay, type Replay } from "./replay"
import type { Sink, TelemetryEvent } from "./telemetry"

// The game's own server (server/, VITE_BACKEND_URL in .env). Off when the address is empty — the game
// then works exactly as before. What it adds:
//   analytics   — every track() event, with the anonymous player id and the A/B variants (backendSink)
//   leaderboard — each finished level is sent with its input replay; the server rejects impossible scores
//                 and keeps the replay of every record (startRun / finishRun / leaderboard)
//   cloud save  — on your own site (no portal SDK) progress lives on the server too, so clearing the
//                 browser loses nothing, and a transfer code moves it to another device (cloudStorage)
// Portals keep their own saves and leaderboards (src/platform); the server never replaces them there.

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL ?? "").replace(/\/$/, "")
export const backendOn = BACKEND_URL !== ""

const TIMEOUT = 4000

async function request<T>(method: string, path: string, body?: unknown): Promise<T | undefined> {
  if (!backendOn) return undefined
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT)
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      signal: controller.signal,
      // text/plain: a "simple" request, no CORS preflight round trip
      headers: body === undefined ? undefined : { "Content-Type": "text/plain;charset=UTF-8" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    clearTimeout(timer)
    return response.ok ? ((await response.json().catch(() => undefined)) as T) : undefined
  } catch {
    // The server is down or slow: the game never waits for it
    return undefined
  }
}

// ---------- analytics ----------

/** Sends events in batches; the rest goes with sendBeacon when the tab closes */
export function backendSink(batch = 20, everyMs = 15_000): Sink {
  let queue: TelemetryEvent[] = []
  const send = () => {
    if (queue.length === 0) return
    const body = JSON.stringify({
      player: playerId(),
      session: sessionId,
      version: __APP_VERSION__,
      exp: assigned,
      events: queue,
    })
    queue = []
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" })
    if (!navigator.sendBeacon(`${BACKEND_URL}/events`, blob))
      void fetch(`${BACKEND_URL}/events`, { method: "POST", body, keepalive: true }).catch(() => {})
  }
  setInterval(send, everyMs)
  // Hidden tab is the last reliable moment on phones (pagehide may never come there)
  addEventListener("visibilitychange", () => document.visibilityState === "hidden" && send())
  addEventListener("pagehide", send)
  return (event) => {
    queue.push(event)
    if (queue.length >= batch || event.name === "error") send()
  }
}

// ---------- leaderboard ----------

export interface LeaderboardEntry {
  rank: number
  /** Anonymous: "#3f2a9" */
  name: string
  score: number
  seconds: number
  /** This player's line */
  you: boolean
}

let runStart = 0
let recordingRun = false
/** The last result on its way to the server: the leaderboard waits for it to include it */
let submitting: Promise<unknown> = Promise.resolve()

/** GameScene.create(): the run's input is recorded for the leaderboard (unless a dev replay is on) */
export function startRun(level: number, time: number) {
  runStart = time
  recordingRun = false
  if (!backendOn || replay.isRecording || replay.isPlaying) return
  replay.startRecording(level)
  recordingRun = true
}

/** GameScene.finish(): a won level goes to the leaderboard with its replay */
export function finishRun(level: number, won: boolean, score: number, time: number) {
  const data: Replay | undefined = recordingRun ? replay.stopRecording() : undefined
  recordingRun = false
  if (!backendOn || !won) return
  submitting = request("POST", "/scores", {
    player: playerId(),
    level: level + 1,
    score,
    seconds: (time - runStart) / 1000,
    replay: data,
  })
}

/** The best results of a level (1-based number): [] without a server */
export async function leaderboard(level: number, limit = 5): Promise<LeaderboardEntry[]> {
  await submitting
  const result = await request<{ top: LeaderboardEntry[] }>(
    "GET",
    `/leaderboard?level=${level}&limit=${limit}&player=${playerId()}`,
  )
  return result?.top ?? []
}

// ---------- cloud save ----------

const SECRET_KEY = "gm-secret"

function secret(): string {
  try {
    let value = localStorage.getItem(SECRET_KEY)
    if (!value) {
      value = randomId() + randomId()
      localStorage.setItem(SECRET_KEY, value)
    }
    return value
  } catch {
    return ""
  }
}

/** "player.secret": typed on another device, it brings the same progress there */
export function transferCode(): string {
  return `${playerId()}.${secret()}`
}

/** Takes a transfer code from another device; true if it looks valid (the next load reads that save) */
export function useTransferCode(code: string): boolean {
  const [id, key] = code.trim().split(".")
  if (!id || !key || !/^[\w-]{8,64}$/.test(id) || key.length < 16) return false
  setPlayerId(id)
  try {
    localStorage.setItem(SECRET_KEY, key)
  } catch {
    return false
  }
  return true
}

type Storage = Pick<Platform, "loadData" | "saveData">

/** Saves with a time stamp, so the newer copy wins when the local and the server ones differ */
const STAMP = "_savedAt"

/** Platforms without cloud saves of their own: there the game server keeps a copy */
const NO_CLOUD = ["none", "vkplay", "poki"]

/**
 * Wraps the platform's storage: on your own site (and portals without cloud saves) with a server, saves also
 * go to the server and the newer copy wins on load. Portal SDKs with cloud saves are returned unchanged.
 */
export function cloudStorage(platform: Pick<Platform, "name"> & Storage): Storage {
  if (!backendOn || !NO_CLOUD.includes(platform.name)) return platform
  const remote = (data: SaveData) => request("PUT", "/save", { player: playerId(), secret: secret(), data })
  return {
    async loadData() {
      const [local, server] = await Promise.all([
        platform.loadData(),
        request<{ data: SaveData | null }>("GET", `/save?player=${playerId()}&secret=${encodeURIComponent(secret())}`),
      ])
      const stamp = (d: SaveData | undefined) => (typeof d?.[STAMP] === "number" ? (d[STAMP] as number) : 0)
      return server?.data && stamp(server.data) > stamp(local) ? server.data : local
    },
    async saveData(data: SaveData) {
      const stamped = { ...data, [STAMP]: Date.now() }
      await platform.saveData(stamped)
      void remote(stamped)
    },
  }
}
