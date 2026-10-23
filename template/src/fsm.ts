// A tiny state machine for entities: the player, enemies, bosses.
// One state at a time; `enter`/`exit`/`update` hooks per state; `set()` ignores the current state.

export interface StateHooks<S extends string> {
  enter?: (from: S | undefined) => void
  exit?: (to: S) => void
  update?: (dt: number) => void
}

export class StateMachine<S extends string> {
  private current: S | undefined
  /** Time spent in the current state, ms */
  elapsed = 0

  constructor(private hooks: Partial<Record<S, StateHooks<S>>> = {}) {}

  get state(): S | undefined {
    return this.current
  }

  is(...states: S[]) {
    return this.current !== undefined && states.includes(this.current)
  }

  /** Switch to `next`; returns true when the state really changed */
  set(next: S): boolean {
    if (next === this.current) return false
    const from = this.current
    if (from !== undefined) this.hooks[from]?.exit?.(next)
    this.current = next
    this.elapsed = 0
    this.hooks[next]?.enter?.(from)
    return true
  }

  update(dt: number) {
    this.elapsed += dt
    if (this.current !== undefined) this.hooks[this.current]?.update?.(dt)
  }
}
