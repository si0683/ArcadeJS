import Phaser from "phaser"

import { GRAVITY } from "./config"
import { platform } from "./platform"
import { save } from "./save"
import { shop } from "./shop"
import { GameScene } from "./scenes/GameScene"
import { HudScene } from "./scenes/HudScene"
import { MenuScene } from "./scenes/MenuScene"
import { PauseScene } from "./scenes/PauseScene"
import { PreloadScene } from "./scenes/PreloadScene"
import { addSink, captureErrors } from "./telemetry"

// Errors and analytics events: printed in dev; in production add a sink (RECIPES.md → "Аналитика")
captureErrors()
if (import.meta.env.DEV) addSink((e) => console.debug("[track]", e.name, e.data))

// The platform (SDK) first: it sets the language and may need to load its script
await platform.init()

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#cfefff",
  // Crisp pixels for pixel art (turns off smoothing, rounds positions)
  pixelArt: true,
  scale: {
    // Fills the window and keeps the 16:9 picture; the camera zooms the 18 px tiles
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  physics: {
    // Arcade: fast and simple, perfect for platformers.
    // For realistic physics (rotation, slopes, joints) switch to "matter" —
    // Matter.js is built into Phaser, see README.
    default: "arcade",
    arcade: { gravity: { x: 0, y: GRAVITY }, debug: false },
  },
  input: { activePointers: 3, gamepad: true },
  scene: [PreloadScene, MenuScene, GameScene, HudScene, PauseScene],
})

// Ads, purchase windows and hidden tabs: silence and freeze the game
platform.onPause(() => {
  game.sound.mute = true
  game.pause()
})
platform.onResume(() => {
  game.sound.mute = false
  game.resume()
})

// A settings change waits up to a second before saving: write it if the page is closed sooner
addEventListener("pagehide", () => void save.flush())

// In dev mode the game is reachable from the browser console: game.scene.getScene("game"),
// and the dev tools are on: F1 overlay, F2 tuning panel, F3 hitboxes, F4 god mode, F6 win the level.
// `import.meta.env.DEV` is false in `npm run build`, so none of this code reaches the players
if (import.meta.env.DEV) {
  Object.assign(window, { game, platform, save, shop })
  void import("./debug").then(({ installDebug }) => installDebug(game))
}
