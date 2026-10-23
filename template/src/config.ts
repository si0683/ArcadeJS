import type Phaser from "phaser"

import type { MoveTuning } from "./movement"

// Game balance: tweak the numbers here. In `npm run dev` press F2 to tune them live
// (the dev panel changes these objects; copy the values you like back into this file).

/** World gravity, px/s² */
export const GRAVITY = 900

/** How the player moves: see src/movement.ts for what every number does */
export const PLAYER: MoveTuning = {
  speed: 160,
  accel: 1400,
  decel: 1800,
  airControl: 0.7,
  jumpSpeed: 400,
  jumpCut: 0.45,
  coyoteMs: 90,
  bufferMs: 120,
  fallGravity: 1.5,
  maxFall: 520,
}

export const SLIME_SPEED = 40
export const LIVES = 3

/** Camera: zoom, follow smoothing (0…1), how far it looks ahead in the run direction (px) */
export const CAMERA = { zoom: 2.5, lerp: 0.12, lookAhead: 36 }

/** "Juice": strength of the screen effects. The menu setting "Effects" turns shake, flashes and filters off */
export const FX = {
  /** Freeze frames on a hit, ms */
  hitstop: 70,
  shake: 0.008,
  /** Landing squash: how much the sprite flattens (0.2 = 20%) */
  squash: 0.22,
}

// Points and rules (used by src/rules.ts)
export const COIN_POINTS = 1
export const STOMP_POINTS = 5
/** How many pixels above the enemy's centre the player must be to squash it */
export const STOMP_MARGIN = 6

export const TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "system-ui, sans-serif",
  fontSize: "26px",
  fontStyle: "bold",
  color: "#ffffff",
  stroke: "#1d1630",
  strokeThickness: 6,
}
