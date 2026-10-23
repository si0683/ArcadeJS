// Platformer movement as plain math: no Phaser inside, so the "feel" is covered by tests
// (src/movement.test.ts) and tuned live in the dev panel (F2). The Player entity applies the result.

export interface MoveTuning {
  /** Top run speed, px/s */
  speed: number
  /** How fast the run speeds up / slows down on the ground, px/s² */
  accel: number
  decel: number
  /** Share of accel/decel in the air: 1 — full control, 0 — none */
  airControl: number
  /** Jump take-off speed, px/s */
  jumpSpeed: number
  /** Releasing jump early multiplies the rising speed by this — short tap, low jump */
  jumpCut: number
  /** Jump still works this long after running off a ledge, ms */
  coyoteMs: number
  /** A jump pressed this long before landing still happens on landing, ms */
  bufferMs: number
  /** Gravity multiplier while falling: >1 makes jumps snappy instead of floaty */
  fallGravity: number
  /** Top fall speed, px/s */
  maxFall: number
}

/** What the player wants this frame */
export interface MoveInput {
  /** −1 … 1 */
  x: number
  jumpHeld: boolean
  jumpPressed: boolean
}

/** What the physics body is doing */
export interface MoveBody {
  vx: number
  vy: number
  onFloor: boolean
}

/** Timers that live between frames */
export interface MoveState {
  coyote: number
  buffer: number
  rising: boolean
}

export interface MoveResult {
  vx: number
  vy: number
  /** Extra gravity scale for this frame (1 — normal) */
  gravityScale: number
  jumped: boolean
  state: MoveState
}

export const START_MOVE: MoveState = { coyote: 0, buffer: 0, rising: false }

/** Move `value` towards `target` by at most `step` */
export function approach(value: number, target: number, step: number): number {
  return value < target ? Math.min(value + step, target) : Math.max(value - step, target)
}

/** One frame of movement; `dt` in ms */
export function stepMovement(
  state: MoveState,
  input: MoveInput,
  body: MoveBody,
  dt: number,
  t: MoveTuning,
): MoveResult {
  let { vx, vy } = body
  let coyote = body.onFloor ? t.coyoteMs : Math.max(0, state.coyote - dt)
  let buffer = input.jumpPressed ? t.bufferMs : Math.max(0, state.buffer - dt)
  let rising = state.rising && vy < 0
  let jumped = false

  // Run: accelerate towards the wanted speed, weaker in the air
  const target = Math.max(-1, Math.min(1, input.x)) * t.speed
  const rate = (input.x !== 0 ? t.accel : t.decel) * (body.onFloor ? 1 : t.airControl)
  vx = approach(vx, target, (rate * dt) / 1000)

  // Jump: buffered press + coyote time forgive a few frames of bad timing
  if (buffer > 0 && coyote > 0) {
    vy = -t.jumpSpeed
    buffer = 0
    coyote = 0
    rising = true
    jumped = true
  } else if (rising && !input.jumpHeld) {
    // Variable height: let go early and the jump is cut short
    vy *= t.jumpCut
    rising = false
  }

  const gravityScale = vy > 0 ? t.fallGravity : 1
  vy = Math.min(vy, t.maxFall)

  return { vx, vy, gravityScale, jumped, state: { coyote, buffer, rising } }
}

export type PlayerState = "idle" | "run" | "jump" | "fall"

/** Which animation state the body is in */
export function pickPlayerState(body: MoveBody): PlayerState {
  if (!body.onFloor) return body.vy < 0 ? "jump" : "fall"
  return Math.abs(body.vx) > 10 ? "run" : "idle"
}
