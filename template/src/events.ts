// Typed game events: the level says what happened ("the player died here"), and every system that cares
// listens — analytics, the game server, achievements, sound captions — without the level knowing them.
// A new system never touches GameScene; a typo in an event name or a field is a type error.
//   gameEvents.emit("death", { level: 0, cause: "fall", x: 120, y: 300 })
//   const off = gameEvents.on("death", (e) => …)   // off() to stop listening
// Listeners that live as long as the page are connected in src/systems.ts.

export interface GameEventMap {
  /** A level began (level — index in LEVELS, time — the scene clock, ms) */
  levelStart: { level: number; time: number }
  /** A life lost: what killed the player and where */
  death: { level: number; cause: string; x: number; y: number }
  checkpoint: { level: number; x: number }
  /** The flag reached or the last life lost */
  levelEnd: { level: number; won: boolean; score: number; stars: number; seconds: number; time: number }
  /** A sound effect played (playSfx): sound captions show it */
  sound: { key: string }
}

type Listener<T> = (event: T) => void

export function createEvents<M extends object>() {
  const listeners = new Map<keyof M, Set<Listener<never>>>()
  return {
    on<K extends keyof M>(name: K, listener: Listener<M[K]>): () => void {
      if (!listeners.has(name)) listeners.set(name, new Set())
      listeners.get(name)!.add(listener as Listener<never>)
      return () => listeners.get(name)?.delete(listener as Listener<never>)
    },
    emit<K extends keyof M>(name: K, event: M[K]) {
      for (const listener of listeners.get(name) ?? []) {
        try {
          ;(listener as Listener<M[K]>)(event)
        } catch (error) {
          // One broken listener must not stop the others or the game
          console.error(`[events] ${String(name)}:`, error)
        }
      }
    },
  }
}

export const gameEvents = createEvents<GameEventMap>()
