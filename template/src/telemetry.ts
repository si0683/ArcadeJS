// Game analytics and error reports in one place. The game calls `track("level_complete", {...})`;
// where the events go is decided by sinks: the console in `npm run dev`, nothing in production
// until you add one (your server, Yandex Metrica, GameAnalytics — see RECIPES.md).
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

/** Uncaught errors and rejected promises become "error" events */
export function captureErrors() {
  addEventListener("error", (e) =>
    track("error", { message: String(e.message), at: `${e.filename ?? ""}:${e.lineno ?? 0}` }),
  )
  addEventListener("unhandledrejection", (e) => track("error", { message: String(e.reason) }))
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
