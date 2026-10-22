import type Phaser from "phaser"

// Game balance: tweak the numbers here
export const PLAYER_SPEED = 160
export const JUMP_SPEED = 400
export const SLIME_SPEED = 40
export const LIVES = 3
export const ZOOM = 2.5

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
