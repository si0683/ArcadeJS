// The game server: analytics with funnels and retention, a leaderboard that checks scores, cloud saves.
// No dependencies — Node.js 20.19+ and files in DATA_DIR (JSON lines for events, JSON for the rest).
//   npm run server                       http://localhost:8787 (from the project folder)
//   ADMIN_TOKEN=… node server/index.mjs  report: http://localhost:8787/report.html?token=…
// The game connects with VITE_BACKEND_URL in .env. Settings, endpoints, deployment: server/README.md.
import { createHash, timingSafeEqual } from "node:crypto"
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { MIN_SECONDS, readLevelLimits } from "./levels.mjs"
import { buildReport, dayOf, renderReport } from "./report.mjs"

const LIMITS = {
  /** Body of one request, bytes (an event batch, a replay) */
  body: 256 * 1024,
  /** One cloud save, bytes */
  save: 64 * 1024,
  /** Events in one batch */
  events: 200,
  /** Write requests per minute from one address */
  writesPerMinute: 120,
  /** One score per player this often, ms */
  scoreEvery: 3000,
}

const ID = /^[\w-]{8,64}$/

/**
 * @param {{ root?: string, dataDir?: string, adminToken?: string, origins?: string[], now?: () => number }} options
 */
export function createGameServer(options = {}) {
  const root = resolve(options.root ?? ".")
  const dataDir = resolve(options.dataDir ?? join(root, "server", "data"))
  const adminToken = options.adminToken ?? ""
  const origins = options.origins ?? ["*"]
  const now = options.now ?? Date.now
  for (const dir of ["events", "saves", "replays"]) mkdirSync(join(dataDir, dir), { recursive: true })

  const levels = readLevelLimits(root)
  const file = (...parts) => join(dataDir, ...parts)
  const readJson = (path, fallback) => {
    try {
      return JSON.parse(readFileSync(path, "utf8"))
    } catch {
      return fallback
    }
  }
  // Written through a temporary file: a crash mid-write never leaves half a file
  const writeJson = (path, data) => {
    writeFileSync(`${path}.tmp`, JSON.stringify(data))
    renameSync(`${path}.tmp`, path)
  }

  /** level → player → { score, seconds, at } */
  const scores = readJson(file("scores.json"), {})
  /** player → first day seen: the base of retention */
  const firstSeen = readJson(file("players.json"), {})
  const dirty = new Set()
  const flush = () => {
    if (dirty.has("scores")) writeJson(file("scores.json"), scores)
    if (dirty.has("players")) writeJson(file("players.json"), firstSeen)
    dirty.clear()
  }
  const timer = setInterval(flush, 2000)
  timer.unref()

  const writes = new Map()
  const lastScore = new Map()
  const limited = (ip) => {
    const minute = Math.floor(now() / 60_000)
    const entry = writes.get(ip)
    if (!entry || entry.minute !== minute) {
      writes.set(ip, { minute, count: 1 })
      return false
    }
    return ++entry.count > LIMITS.writesPerMinute
  }

  const isAdmin = (url, req) => {
    if (!adminToken) return false
    const given = url.searchParams.get("token") ?? (req.headers.authorization ?? "").replace(/^Bearer /, "")
    const a = Buffer.from(given)
    const b = Buffer.from(adminToken)
    return a.length === b.length && timingSafeEqual(a, b)
  }

  /** Event records of the last `days` days */
  const readEvents = (days) => {
    const from = dayOf(now() - (days - 1) * 86_400_000)
    const list = []
    for (const name of readdirSync(file("events")).sort()) {
      if (!name.endsWith(".jsonl") || name.slice(0, 10) < from) continue
      for (const line of readFileSync(file("events", name), "utf8").split("\n")) {
        if (!line) continue
        try {
          list.push(JSON.parse(line))
        } catch {
          // A torn last line after a crash: skip it
        }
      }
    }
    return list
  }

  const routes = {
    "GET /health": () => [200, { ok: true, levels: Object.keys(levels).length }],

    // ---------- analytics ----------
    "POST /events": (body) => {
      const { player, session = "", version = "", exp = {}, events } = body
      if (!ID.test(String(player)) || !Array.isArray(events)) return [400, { error: "player and events required" }]
      const time = now()
      const day = dayOf(time)
      if (!firstSeen[player]) {
        firstSeen[player] = day
        dirty.add("players")
      }
      const lines = []
      for (const e of events.slice(0, LIMITS.events)) {
        if (!e || typeof e.name !== "string" || e.name.length > 40) continue
        lines.push(
          JSON.stringify({
            ts: time,
            day,
            player,
            session: String(session).slice(0, 64),
            version: String(version).slice(0, 40),
            exp: cleanFlat(exp, 10),
            name: e.name,
            data: cleanFlat(e.data, 20),
          }),
        )
      }
      if (lines.length) appendFileSync(file("events", `${day}.jsonl`), lines.join("\n") + "\n")
      return [204]
    },

    "GET /report": (_body, url) => [200, buildReport(readEvents(days(url)), firstSeen)],
    "GET /report.html": (_body, url) => [200, renderReport(buildReport(readEvents(days(url)), firstSeen)), "text/html"],

    /** Death points for the dev heat map (F9 → Shift+F9 opens this file) */
    "GET /deaths": (_body, url) => {
      const level = Number(url.searchParams.get("level") ?? 0)
      const deaths = readEvents(days(url))
        .filter((e) => e.name === "death" && (!level || e.data.level === level))
        .map((e) => ({ level: e.data.level, x: e.data.x, y: e.data.y, cause: e.data.cause }))
      return [200, { deaths }]
    },

    // ---------- leaderboard ----------
    "POST /scores": (body) => {
      const { player, level, score, seconds, replay } = body
      const limit = levels[level]
      if (!ID.test(String(player)) || !limit) return [400, { error: "unknown player or level" }]
      if (!Number.isInteger(score) || score < 0 || score > limit.maxScore) return [422, { error: "impossible score" }]
      if (typeof seconds !== "number" || seconds < MIN_SECONDS) return [422, { error: "impossible time" }]
      if (now() - (lastScore.get(player) ?? 0) < LIMITS.scoreEvery) return [429, { error: "too often" }]
      lastScore.set(player, now())
      const board = (scores[level] ??= {})
      const old = board[player]
      // Better score, or the same score faster
      if (!old || score > old.score || (score === old.score && seconds < old.seconds)) {
        board[player] = { score, seconds: Math.round(seconds * 10) / 10, at: now() }
        dirty.add("scores")
        // The replay of a new best is kept: a suspicious record can be watched (F8) or re-run (npm run verify)
        if (replay && typeof replay === "object") {
          mkdirSync(file("replays", String(level)), { recursive: true })
          writeJson(file("replays", String(level), `${player}.json`), replay)
        }
      }
      return [200, { best: board[player].score, rank: rankOf(board, player) }]
    },

    "GET /leaderboard": (_body, url) => {
      const level = Number(url.searchParams.get("level"))
      const board = scores[level] ?? {}
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 10)))
      const player = url.searchParams.get("player") ?? ""
      const top = sorted(board)
        .slice(0, limit)
        .map(([id, s], i) => ({
          rank: i + 1,
          name: shortName(id),
          score: s.score,
          seconds: s.seconds,
          you: id === player,
        }))
      const you = board[player] ? { rank: rankOf(board, player), score: board[player].score } : null
      return [200, { level, top, you }]
    },

    // ---------- cloud save: the player id plus a secret only this player's devices know ----------
    "GET /save": (_body, url) => {
      const player = url.searchParams.get("player") ?? ""
      const stored = ID.test(player) ? readJson(file("saves", `${player}.json`), null) : null
      // No save yet is a normal answer (a 404 would show as an error in the browser console)
      if (!stored) return [200, { data: null }]
      if (!sameSecret(stored, url.searchParams.get("secret") ?? "")) return [403, { error: "wrong secret" }]
      return [200, { data: stored.data, savedAt: stored.savedAt }]
    },

    "PUT /save": (body) => {
      const { player, secret, data } = body
      if (!ID.test(String(player)) || typeof secret !== "string" || secret.length < 16)
        return [400, { error: "player and secret required" }]
      if (!data || typeof data !== "object" || JSON.stringify(data).length > LIMITS.save)
        return [413, { error: "save too big" }]
      const path = file("saves", `${player}.json`)
      const stored = readJson(path, null)
      if (stored && !sameSecret(stored, secret)) return [403, { error: "wrong secret" }]
      const savedAt = now()
      writeJson(path, { secret: hash(secret), data, savedAt })
      return [200, { savedAt }]
    },
  }
  const ADMIN = new Set(["GET /report", "GET /report.html", "GET /deaths"])
  const WRITES = new Set(["POST /events", "POST /scores", "PUT /save"])

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost")
    const origin = req.headers.origin ?? ""
    const allowed = origins.includes("*") ? "*" : origins.includes(origin) ? origin : ""
    if (allowed) res.setHeader("Access-Control-Allow-Origin", allowed)
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
    const send = (status, body, type = "application/json") => {
      res.writeHead(status, { "Content-Type": `${type}; charset=utf-8`, "Cache-Control": "no-store" })
      res.end(body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body))
    }
    if (req.method === "OPTIONS") return send(204)

    const key = `${req.method} ${url.pathname}`
    const route = routes[key]
    if (!route) return send(404, { error: "not found" })
    if (ADMIN.has(key) && !isAdmin(url, req)) {
      return send(403, { error: adminToken ? "wrong token" : "set ADMIN_TOKEN to open the report" })
    }
    if (WRITES.has(key) && limited(req.socket.remoteAddress ?? "")) return send(429, { error: "too many requests" })

    let body = {}
    if (req.method === "POST" || req.method === "PUT") {
      try {
        body = JSON.parse(await readBody(req))
      } catch (error) {
        return send(error.message === "too big" ? 413 : 400, {
          error: error.message === "too big" ? "body too big" : "not JSON",
        })
      }
    }
    try {
      const [status, payload, type] = route(body ?? {}, url)
      send(status, payload, type)
    } catch (error) {
      console.error(`[server] ${key}:`, error)
      send(500, { error: "server error" })
    }
  })
  server.on("close", () => {
    clearInterval(timer)
    flush()
  })
  return server
}

// ---------- helpers ----------

const days = (url) => Math.min(365, Math.max(1, Number(url.searchParams.get("days") ?? 30)))
const hash = (secret) => createHash("sha256").update(secret).digest("hex")
const sameSecret = (stored, secret) => stored.secret === hash(secret)
const sorted = (board) => Object.entries(board).sort((a, b) => b[1].score - a[1].score || a[1].seconds - b[1].seconds)
const rankOf = (board, player) => sorted(board).findIndex(([id]) => id === player) + 1
/** Players are anonymous: the board shows the first letters of the id */
const shortName = (id) => `#${id.replace(/-/g, "").slice(0, 5)}`

/** An object with at most `max` plain values (strings cut to 200 letters): event data never grows unbounded */
function cleanFlat(value, max) {
  const out = {}
  if (!value || typeof value !== "object") return out
  for (const [k, v] of Object.entries(value).slice(0, max)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k.slice(0, 40)] = v
    else if (typeof v === "boolean") out[k.slice(0, 40)] = v
    else if (typeof v === "string") out[k.slice(0, 40)] = v.slice(0, k === "stack" ? 2000 : 200)
  }
  return out
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let size = 0
    const chunks = []
    req.on("data", (chunk) => {
      size += chunk.length
      if (size > LIMITS.body) {
        reject(new Error("too big"))
        req.destroy()
      } else chunks.push(chunk)
    })
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8") || "{}"))
    req.on("error", reject)
  })
}

// ---------- run: node server/index.mjs ----------

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  // server/.env (optional): KEY=value lines
  const envFile = fileURLToPath(new URL(".env", import.meta.url))
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line)
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
    }
  }
  const env = process.env
  const port = Number(env.PORT ?? 8787)
  const server = createGameServer({
    root: fileURLToPath(new URL("..", import.meta.url)),
    dataDir: env.DATA_DIR,
    adminToken: env.ADMIN_TOKEN ?? "",
    origins: (env.ALLOWED_ORIGINS ?? "*").split(",").map((s) => s.trim()),
  })
  server.listen(port, () => {
    console.log(`Game server: http://localhost:${port}`)
    console.log(
      env.ADMIN_TOKEN ? `Report: http://localhost:${port}/report.html?token=…` : "Report is off: set ADMIN_TOKEN",
    )
  })
  const stop = () => server.close(() => process.exit(0))
  process.on("SIGINT", stop)
  process.on("SIGTERM", stop)
}
