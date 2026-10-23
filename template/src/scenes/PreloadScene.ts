import Phaser from "phaser"

import { makeFxTextures } from "../fx"
import { installRotatePrompt } from "../orientation"
import { makeLevelTextures } from "../parallax"
import { platform } from "../platform"
import { save } from "../save"
import { shop } from "../shop"

// Loads the shared assets once and builds the animations, then opens the menu.
// Level maps are not here: each loads when its level starts (GameScene.preload).
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload")
  }

  preload() {
    const { width, height } = this.scale
    const bar = this.add.rectangle(width / 2 - 150, height / 2, 0, 12, 0x8b5cf6).setOrigin(0, 0.5)
    this.add.rectangle(width / 2, height / 2, 304, 16).setStrokeStyle(2, 0x8b5cf6)
    this.load.on("progress", (value: number) => (bar.width = 300 * value))

    this.load.setPath("assets")
    // Tiles of the Tiled maps (https://www.mapeditor.org); the same image as 18×18 frames
    // for objects built from tiles (moving platforms)
    this.load.image("tiles", "maps/tiles.png")
    this.load.spritesheet("tiles-sheet", "maps/tiles.png", { frameWidth: 18, frameHeight: 18 })

    this.load.spritesheet("player", "sprites/player.png", { frameWidth: 24, frameHeight: 24 })
    this.load.spritesheet("slime", "sprites/slime.png", { frameWidth: 24, frameHeight: 24 })
    this.load.image("coin", "sprites/coin.png")
    this.load.image("flag", "sprites/flag.png")
    this.load.image("heart", "sprites/heart.png")
    this.load.image("cloud", "sprites/cloud.png")

    this.load.audio("jump", "sounds/jump.wav")
    this.load.audio("coin", "sounds/coin.wav")
    this.load.audio("hurt", "sounds/hurt.wav")
    this.load.audio("win", "sounds/win.wav")
    this.load.audio("music", "sounds/music.mp3")
  }

  async create() {
    // Particle textures are drawn in code: no files to load
    makeFxTextures(this)
    makeLevelTextures(this)
    this.anims.create({
      key: "player-walk",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 1 }),
      frameRate: 8,
      repeat: -1,
    })
    this.anims.create({
      key: "slime-walk",
      frames: this.anims.generateFrameNumbers("slime", { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    })
    // Saved progress and settings (Yandex: player cloud data, otherwise localStorage)
    await save.load()
    // Bought products (Yandex: player purchases); also delivers ones paid but not given last time
    await shop.restore()
    // Needs the saved language: "turn your phone sideways" over a portrait screen
    installRotatePrompt()

    // Everything is loaded and the menu is about to show: tell the platform (Yandex: Game Ready)
    platform.ready()
    // Pop-ups (achievements, daily reward) live above all scenes for the whole game
    this.scene.launch("toast")
    this.scene.start("menu")
  }
}
