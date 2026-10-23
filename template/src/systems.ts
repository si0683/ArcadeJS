import { finishRun, startRun } from "./backend"
import { gameEvents } from "./events"
import { track } from "./telemetry"

// Systems that follow the game through its events (src/events.ts) — connected once in src/main.ts.
// The levels only announce what happened; what to do with it is decided here.

export function connectSystems() {
  // ---------- analytics: event names and fields as the reports expect them (1-based levels) ----------
  gameEvents.on("levelStart", (e) => track("level_start", { level: e.level + 1 }))
  gameEvents.on("checkpoint", (e) => track("checkpoint", { level: e.level + 1, x: Math.round(e.x) }))
  gameEvents.on("death", (e) =>
    track("death", { level: e.level + 1, cause: e.cause, x: Math.round(e.x), y: Math.round(e.y) }),
  )
  gameEvents.on("levelEnd", (e) =>
    track(e.won ? "level_complete" : "game_over", {
      level: e.level + 1,
      score: e.score,
      stars: e.stars,
      seconds: e.seconds,
    }),
  )

  // ---------- the game server's leaderboard (VITE_BACKEND_URL): the run is recorded to prove the score ----------
  gameEvents.on("levelStart", (e) => startRun(e.level, e.time))
  gameEvents.on("levelEnd", (e) => finishRun(e.level, e.won, e.score, e.time))
}
