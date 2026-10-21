import Phaser from "phaser"

import { GameScene } from "./scenes/GameScene"
import { HudScene } from "./scenes/HudScene"
import { MenuScene } from "./scenes/MenuScene"
import { PreloadScene } from "./scenes/PreloadScene"

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
    arcade: { gravity: { x: 0, y: 900 }, debug: false },
  },
  input: { activePointers: 3 },
  scene: [PreloadScene, MenuScene, GameScene, HudScene],
})

// In dev mode the game is reachable from the browser console: game.scene.getScene("game")
if (import.meta.env.DEV) Object.assign(window, { game })
