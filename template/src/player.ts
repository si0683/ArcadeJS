// An anonymous id of this browser: random, kept in localStorage, never tied to a name or an account.
// Analytics count players with it (retention: did they come back on day 1, day 7), experiments split
// players into stable groups, the game server keeps the scores and the cloud save under it.

const KEY = "gm-player"
let cached: string | undefined

/** A random id; crypto.randomUUID exists only on https and localhost, so build it by hand elsewhere */
export function randomId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function playerId(): string {
  if (cached) return cached
  try {
    cached = localStorage.getItem(KEY) ?? undefined
    if (!cached) {
      cached = randomId()
      localStorage.setItem(KEY, cached)
    }
  } catch {
    // Storage blocked (private mode in some browsers): an id for this session only
    cached = randomId()
  }
  return cached
}

/** Use an id brought from another device (a transfer code, src/backend.ts) */
export function setPlayerId(id: string) {
  cached = id
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // Kept for this session
  }
}

/** One page visit: events of a session are grouped by it */
export const sessionId = randomId()
