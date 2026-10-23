import type Phaser from "phaser"

import BALANCE from "../content/balance.json"
import type { MoveTuning } from "./movement"

// Game balance lives in content/balance.json — a designer changes numbers there without touching code;
// content/schema.ts says what every number means and its allowed range, and `npm run dev` / `npm run check`
// stop with a clear message when a value is wrong. In `npm run dev` press F2 to tune them live
// (the dev panel changes these objects; "Copy" gives JSON to paste back into content/balance.json).
// The objects are copies: the dev panel and the remote config (src/remote.ts) change them at run time.

export { BALANCE }

/** World gravity, px/s² */
export const GRAVITY = BALANCE.WORLD.gravity

/** How the player moves: see src/movement.ts for what every number does */
export const PLAYER: MoveTuning = { ...BALANCE.PLAYER }

export const SLIME_SPEED = BALANCE.WORLD.slimeSpeed
export const LIVES = BALANCE.WORLD.lives

/** Camera: zoom, follow smoothing (0…1), how far it looks ahead in the run direction (px) */
export const CAMERA = { ...BALANCE.CAMERA }

/** "Juice": strength of the screen effects. The menu setting "Effects" turns shake, flashes and filters off */
export const FX = { ...BALANCE.FX }

/**
 * Optional systems: switch off what your game does not need — the code stays, the feature disappears.
 * Every one is described in RECIPES.md.
 */
export const FEATURES = {
  /** Level select screen with stars; off — "Play" starts the first level, levels go one after another */
  levelSelect: true,
  /** Tiled points "checkpoint": respawn there instead of the level start */
  checkpoints: true,
  /** Tiled points "hint": tutorial texts that appear near the player */
  hints: true,
  /** Background layers that move slower than the level */
  parallax: true,
  /** Achievements with a pop-up (src/achievements.ts) */
  achievements: true,
  /** A reward for coming back every day (src/daily.ts) */
  dailyReward: true,
  /** "Rotate your phone" over a portrait screen */
  rotatePrompt: true,
  /** Balance overrides from a JSON file at this URL (src/remote.ts); "" — off */
  remoteConfigUrl: "",
}

/** Springs and moving platforms (Tiled objects "spring", "platform") */
export const SPRING_SPEED = BALANCE.WORLD.springSpeed
export const PLATFORM_SPEED = BALANCE.WORLD.platformSpeed

// Points and rules (used by src/rules.ts)
export const COIN_POINTS = BALANCE.POINTS.coin
export const STOMP_POINTS = BALANCE.POINTS.stomp
/** How many pixels above the enemy's centre the player must be to squash it */
export const STOMP_MARGIN = BALANCE.POINTS.stompMargin

export const TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "system-ui, sans-serif",
  fontSize: "26px",
  fontStyle: "bold",
  color: "#ffffff",
  stroke: "#1d1630",
  strokeThickness: 6,
}
