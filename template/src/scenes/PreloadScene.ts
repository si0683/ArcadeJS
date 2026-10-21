import Phaser from "phaser"

// Loads every asset once and builds the animations, then opens the menu.
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
    // Level made in Tiled (https://www.mapeditor.org): open maps/level1.tmj in Tiled to edit it
    this.load.tilemapTiledJSON("level1", "maps/level1.tmj")
    this.load.image("tiles", "maps/tiles.png")

    this.load.spritesheet("player", "sprites/player.png", { frameWidth: 24, frameHeight: 24 })
    this.load.spritesheet("slime", "sprites/slime.png", { frameWidth: 24, frameHeight: 24 })
    this.load.image("coin", "sprites/coin.png")
    this.load.image("flag", "sprites/flag.png")
    this.load.image("heart", "sprites/heart.png")

    this.load.audio("jump", "sounds/jump.wav")
    this.load.audio("coin", "sounds/coin.wav")
    this.load.audio("hurt", "sounds/hurt.wav")
    this.load.audio("win", "sounds/win.wav")
    this.load.audio("music", "sounds/music.mp3")
  }

  create() {
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
    this.scene.start("menu")
  }
}
