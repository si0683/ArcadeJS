// Game analytics and error reports in one place. The game calls `track("level_complete", {...})`;
// where the events go is decided by sinks: the console in `npm run dev`, nothing in production
// until you add one — the game server (src/backend.ts, funnels and retention), Sentry (errors with
// the line in your source), Yandex Metrica (goals). src/main.ts turns them on from .env.
// Knowing where players quit and which errors they hit is how a game gets better after release.

export interface TelemetryEvent {
  name: string
  data: Record<string, string | number | boolean>
  /** ms since the page opened */
  time: number
}

export type Sink = (event: TelemetryEvent) => void

const sinks: Sink[] = []
/** The latest events, newest last: the dev overlay (F1) shows them */
export const recent: TelemetryEvent[] = []
const RECENT_MAX = 30

export function addSink(sink: Sink) {
  sinks.push(sink)
}

export function track(name: string, data: TelemetryEvent["data"] = {}) {
  const event: TelemetryEvent = { name, data, time: Math.round(performance.now()) }
  recent.push(event)
  if (recent.length > RECENT_MAX) recent.shift()
  for (const sink of sinks) {
    try {
      sink(event)
    } catch {
      // A broken analytics service must never break the game
    }
  }
}

/** An error the game caught itself (a failed load, a broken save) — reported like an uncaught one */
export function reportError(error: unknown, where = "") {
  const e = error instanceof Error ? error : new Error(String(error))
  track("error", { message: e.message, type: e.name, at: where, stack: e.stack ?? "" })
}

/** Uncaught errors and rejected promises become "error" events (with the stack for Sentry) */
export function captureErrors() {
  addEventListener("error", (e) => {
    const error = e.error as Error | undefined
    track("error", {
      message: String(e.message),
      type: error?.name ?? "Error",
      at: `${e.filename ?? ""}:${e.lineno ?? 0}`,
      stack: error?.stack ?? "",
    })
  })
  addEventListener("unhandledrejection", (e) => {
    const reason = e.reason as Error | undefined
    track("error", {
      message: String(reason?.message ?? reason),
      type: reason?.name ?? "UnhandledRejection",
      stack: reason?.stack ?? "",
    })
  })
}

/** A sink that posts events in batches to your endpoint (survives closing the tab via sendBeacon) */
export function beaconSink(url: string, batch = 10): Sink {
  let queue: TelemetryEvent[] = []
  const send = () => {
    if (queue.length === 0) return
    navigator.sendBeacon(url, JSON.stringify(queue))
    queue = []
  }
  addEventListener("pagehide", send)
  return (event) => {
    queue.push(event)
    if (queue.length >= batch || event.name === "error") send()
  }
}

// ---------- Sentry: errors with the stack, grouped, with alerts ----------

export interface StackFrame {
  function: string
  filename: string
  lineno: number
  colno: number
  in_app: boolean
}

/** Chrome ("at fn (url:1:2)") and Firefox/Safari ("fn@url:1:2") stacks → frames, oldest first as Sentry wants */
export function parseStack(stack: string): StackFrame[] {
  const frames: StackFrame[] = []
  for (const line of stack.split("\n")) {
    const m = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/.exec(line) ?? /^(.*?)@(.+?):(\d+):(\d+)$/.exec(line)
    if (!m) continue
    frames.push({
      function: m[1] || "?",
      filename: m[2],
      lineno: Number(m[3]),
      colno: Number(m[4]),
      in_app: !/node_modules|chrome-extension:|moz-extension:/.test(m[2]),
    })
  }
  return frames.reverse()
}

/** Ids that `sentry-cli sourcemaps inject` writes into the built files: Sentry finds each file's source map by them */
function debugMeta() {
  const ids = (globalThis as { _sentryDebugIds?: Record<string, string> })._sentryDebugIds
  if (!ids) return undefined
  const images = Object.entries(ids).flatMap(([stack, debugId]) => {
    // The stack was taken inside the file itself: its newest frame names the file
    const file = parseStack(stack).at(-1)?.filename
    return file ? [{ type: "sourcemap", code_file: file, debug_id: debugId }] : []
  })
  return { images }
}

/**
 * Sends "error" events to Sentry (sentry.io or your own GlitchTip — the same protocol) without the
 * 70 KB SDK. The DSN comes from the project settings. Upload source maps with the same `release`
 * (RECIPES.md → «Ошибки в Sentry») and Sentry shows the line in src/, not in the minified bundle.
 * At most `limit` reports per visit, repeats of one message are sent once.
 */
export function sentrySink(
  dsn: string,
  options: { release?: string; environment?: string; limit?: number } = {},
): Sink {
  const m = /^(https?):\/\/([^@]+)@([^/]+)\/(.*?)\/?(\d+)$/.exec(dsn)
  if (!m) {
    console.warn("[sentry] DSN is not valid:", dsn)
    return () => {}
  }
  const [, scheme, key, host, prefix, project] = m
  const url = `${scheme}://${host}/${prefix ? `${prefix}/` : ""}api/${project}/envelope/?sentry_key=${key}&sentry_version=7`
  const seen = new Set<string>()
  const limit = options.limit ?? 20
  return (event) => {
    if (event.name !== "error" || seen.size >= limit) return
    const message = String(event.data.message ?? "")
    if (seen.has(message)) return
    seen.add(message)
    const id = crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "")
    const report = {
      event_id: id,
      timestamp: Date.now() / 1000,
      platform: "javascript",
      level: "error",
      release: options.release,
      environment: options.environment ?? "production",
      exception: {
        values: [
          {
            type: String(event.data.type ?? "Error"),
            value: message,
            stacktrace: { frames: parseStack(String(event.data.stack ?? "")) },
          },
        ],
      },
      tags: { at: String(event.data.at ?? "") },
      debug_meta: debugMeta(),
      request: { url: location.href, headers: { "User-Agent": navigator.userAgent } },
    }
    const body = [
      JSON.stringify({ event_id: id, sent_at: new Date().toISOString(), dsn }),
      JSON.stringify({ type: "event" }),
      JSON.stringify(report),
    ].join("\n")
    // text/plain: no CORS preflight, the way Sentry's own SDK sends it
    void fetch(url, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
    }).catch(() => {})
  }
}

// ---------- Yandex Metrica: goals for the marketing side ----------

type Ym = ((id: number, method: string, ...args: unknown[]) => void) & { a?: unknown[]; l?: number }

/** Every event becomes a Metrica goal with its data as parameters. The counter is created on metrica.yandex.ru */
export function metricaSink(counter: number): Sink {
  const w = window as unknown as { ym?: Ym }
  if (!w.ym) {
    // The official loader: queues calls until tag.js arrives
    const ym = ((...args: unknown[]) => (ym.a ??= []).push(args)) as Ym
    ym.l = Date.now()
    w.ym = ym
    const script = document.createElement("script")
    script.async = true
    script.src = "https://mc.yandex.ru/metrika/tag.js"
    document.head.append(script)
    ym(counter, "init", { clickmap: false, trackLinks: false, accurateTrackBounce: true })
  }
  return (event) => w.ym?.(counter, "reachGoal", event.name, event.data)
}
