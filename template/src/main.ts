import Phaser from "phaser"

import { backendOn, backendSink } from "./backend"
import { GRAVITY } from "./config"
import { platform } from "./platform"
import { save } from "./save"
import { shop } from "./shop"
import { connectSystems } from "./systems"
import { GameScene } from "./scenes/GameScene"
import { loadRemoteConfig } from "./remote"
import { replay } from "./replay"
import { HudScene } from "./scenes/HudScene"
import { LevelSelectScene } from "./scenes/LevelSelectScene"
import { MenuScene } from "./scenes/MenuScene"
import { PauseScene } from "./scenes/PauseScene"
import { PreloadScene } from "./scenes/PreloadScene"
import { SettingsScene } from "./scenes/SettingsScene"
import { ToastScene } from "./scenes/ToastScene"
import { addSink, captureErrors, metricaSink, sentrySink } from "./telemetry"

// Errors and analytics events: printed in dev; in production the services from .env receive them
// (.env.example; RECIPES.md → «Аналитика»). Nothing is sent when the keys are empty
captureErrors()
if (import.meta.env.DEV) addSink((e) => console.debug("[track]", e.name, e.data))
const env = import.meta.env
if (env.VITE_SENTRY_DSN) addSink(sentrySink(env.VITE_SENTRY_DSN, { release: __APP_VERSION__, environment: env.MODE }))
if (env.VITE_METRICA_ID) addSink(metricaSink(Number(env.VITE_METRICA_ID)))
if (backendOn) addSink(backendSink())
// Analytics and the game server listen to the levels' events
connectSystems()

// The platform (SDK) first: it sets the language and may need to load its script.
// Remote balance overrides (FEATURES.remoteConfigUrl) load at the same time
await Promise.all([platform.init(), loadRemoteConfig()])

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
  scene: [PreloadScene, MenuScene, LevelSelectScene, SettingsScene, GameScene, HudScene, PauseScene, ToastScene],
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
  Object.assign(window, { game, platform, save, shop, replay })
  void import("./debug").then(({ installDebug }) => installDebug(game))
}
