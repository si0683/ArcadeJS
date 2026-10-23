// Top-down movement as plain math: walking in eight directions with acceleration and friction,
// and a dash with a cooldown. Tested in topdown.test.ts; the Hero entity applies the result.
// Numbers: HERO below (tune them live with F2 → they are bound like PLAYER).

export interface TopDownTuning {
  /** Walking speed, px/s */
  speed: number
  /** Speed-up and slow-down, px/s² */
  accel: number
  friction: number
  /** Dash speed (px/s), how long it lasts and the wait before the next one, ms */
  dashSpeed: number
  dashMs: number
  dashCooldownMs: number
}

export const HERO: TopDownTuning = {
  speed: 110,
  accel: 900,
  friction: 1100,
  dashSpeed: 300,
  dashMs: 150,
  dashCooldownMs: 600,
}

export interface TopDownInput {
  /** −1…1 each */
  x: number
  y: number
  dashPressed: boolean
}

export interface TopDownState {
  /** Dash time left, ms (> 0 — dashing, the hero is invulnerable) */
  dash: number
  cooldown: number
  /** Last walking direction (unit vector): the dash goes this way */
  faceX: number
  faceY: number
}

export const START_TOPDOWN: TopDownState = { dash: 0, cooldown: 0, faceX: 1, faceY: 0 }

const approach = (value: number, target: number, step: number) =>
  value < target ? Math.min(value + step, target) : Math.max(value - step, target)

/** One frame; `dt` in ms */
export function stepTopDown(
  state: TopDownState,
  input: TopDownInput,
  velocity: { vx: number; vy: number },
  dt: number,
  t: TopDownTuning,
): { vx: number; vy: number; dashed: boolean; state: TopDownState } {
  let { dash, cooldown, faceX, faceY } = state
  cooldown = Math.max(0, cooldown - dt)
  dash = Math.max(0, dash - dt)

  // Diagonals are not faster: the input vector is clamped to length 1
  const length = Math.hypot(input.x, input.y)
  const nx = length > 1 ? input.x / length : input.x
  const ny = length > 1 ? input.y / length : input.y
  if (length > 0.1) {
    const l = Math.hypot(nx, ny)
    faceX = nx / l
    faceY = ny / l
  }

  if (input.dashPressed && cooldown === 0 && dash === 0) {
    dash = t.dashMs
    cooldown = t.dashCooldownMs + t.dashMs
    return { vx: faceX * t.dashSpeed, vy: faceY * t.dashSpeed, dashed: true, state: { dash, cooldown, faceX, faceY } }
  }
  if (dash > 0) return { vx: velocity.vx, vy: velocity.vy, dashed: false, state: { dash, cooldown, faceX, faceY } }

  const rate = ((length > 0.1 ? t.accel : t.friction) * dt) / 1000
  return {
    vx: approach(velocity.vx, nx * t.speed, rate),
    vy: approach(velocity.vy, ny * t.speed, rate),
    dashed: false,
    state: { dash, cooldown, faceX, faceY },
  }
}
