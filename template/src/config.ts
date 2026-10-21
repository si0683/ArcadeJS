import type Phaser from "phaser"

// Game balance: tweak the numbers here
export const PLAYER_SPEED = 160
export const JUMP_SPEED = 400
export const SLIME_SPEED = 40
export const LIVES = 3
export const ZOOM = 2.5

export const TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "system-ui, sans-serif",
  fontSize: "26px",
  fontStyle: "bold",
  color: "#ffffff",
  stroke: "#1d1630",
  strokeThickness: 6,
}
