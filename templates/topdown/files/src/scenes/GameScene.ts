import Phaser from "phaser"

import { playMusic, playSfx, stopMusic } from "../audio"
import { cheats } from "../cheats"
import { CAMERA, COIN_POINTS, FEATURES, FX, LIVES } from "../config"
import { Chaser } from "../entities/Chaser"
import { Hero } from "../entities/Hero"
import { Fx } from "../fx"
import { t, type Key } from "../i18n"
import { Controls } from "../input"
import { LEVELS, recordResult, starsFor } from "../levels"
import { Look } from "../look"
import { unlockAchievements } from "../meta"
import { platform } from "../platform"
import { isRecord, loseLife } from "../rules"
import { save } from "../save"
import { PRODUCTS, shop } from "../shop"
import { track } from "../telemetry"
import { prop } from "../tiled"
import { fadeIn, goTo } from "../transition"
import type { HudScene } from "./HudScene"

/** What the next scene learns about the finished level */
export interface LevelResultData {
  level: number
  won: boolean
  score: number
  stars: number
}

/** Points for defeating a chaser with a dash */
const DASH_POINTS = 5

// Top-down level: walk in eight directions, collect coins, avoid or dash through the slimes,
// reach the flag. The map comes from Tiled: layer "decor" — the floor (no collision),
// "ground" — walls (collides) and water (hazard), "objects" — points by name.
export class GameScene extends Phaser.Scene {
  player!: Hero
  fx!: Fx
  look!: Look
  /** Index in LEVELS */
  level = 0
  private controls!: Controls
  private walls!: Phaser.Tilemaps.TilemapLayer
  private chasers!: Phaser.Physics.Arcade.Group
  private hints: { text: Phaser.GameObjects.Text; x: number; y: number }[] = []
  private spawn = new Phaser.Math.Vector2()
  private finished = false
  private startedAt = 0
  private coinsTotal = 0
  private coinsTaken = 0
  private damage = 0

  constructor() {
    super("game")
  }

  init(data: { level?: number }) {
    this.level = Phaser.Math.Clamp(data.level ?? 0, 0, LEVELS.length - 1)
  }

  // Maps load when their level starts: the first screen does not wait for every level
  preload() {
    const level = LEVELS[this.level]
    if (!this.cache.tilemap.exists(level.key)) this.load.setPath("assets").tilemapTiledJSON(level.key, level.file)
  }

  create() {
    this.finished = false
    this.startedAt = this.time.now
    this.coinsTotal = this.coinsTaken = this.damage = 0
    this.hints = []
    this.registry.set({ score: 0, lives: LIVES, level: this.level, genre: "topdown" })
    this.fx = new Fx(this)
    this.look = new Look(this.cameras.main)
    // Seen from above: nothing falls
    this.physics.world.gravity.y = 0
    this.cameras.main.setBackgroundColor("#2a2238")

    // ---------- level from Tiled ----------
    const map = this.make.tilemap({ key: LEVELS[this.level].key })
    const tileset = map.addTilesetImage("tiles", "tiles")!
    map.createLayer("decor", tileset)
    this.walls = map.createLayer("ground", tileset) as Phaser.Tilemaps.TilemapLayer
    this.walls.setCollisionByProperty({ collides: true })
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    // ---------- objects ----------
    const glow = this.look.glowLayer().setDepth(4)
    glow.add(this.fx.sparkEmitter)
    const coins = this.physics.add.staticGroup()
    const checkpoints = this.physics.add.staticGroup()
    this.chasers = this.physics.add.group()
    let flag: Phaser.Types.Physics.Arcade.ImageWithStaticBody | undefined

    for (const obj of map.getObjectLayer("objects")?.objects ?? []) {
      const x = obj.x ?? 0
      const y = obj.y ?? 0
      switch (obj.name) {
        case "player":
          this.spawn.set(x, y)
          break
        case "coin":
          glow.add(coins.create(x, y, "coin"))
          this.coinsTotal++
          break
        case "flag":
          flag = this.physics.add.staticImage(x, y, "flag")
          break
        case "slime": {
          const chaser = new Chaser(this, x, y)
          this.chasers.add(chaser)
          chaser.start(prop(obj, "speed", 40), prop(obj, "sight", 90))
          break
        }
        case "checkpoint":
          if (FEATURES.checkpoints) {
            const point = checkpoints.create(x, y, "flag") as Phaser.Physics.Arcade.Image
            point.setTint(0x8a8fa8).setAlpha(0.8)
          }
          break
        case "hint":
          if (FEATURES.hints) this.addHint(x, y, prop(obj, "text", "") as Key)
          break
      }
    }

    // ---------- hero ----------
    this.player = new Hero(this, this.spawn.x, this.spawn.y, this.fx)
    this.physics.add.collider(this.player, this.walls)
    this.physics.add.collider(this.chasers, this.walls)
    this.physics.add.overlap(this.player, coins, (_p, obj) => {
      const coin = obj as Phaser.Physics.Arcade.Image
      this.fx.sparks(coin.x, coin.y)
      this.fx.popText(coin.x, coin.y - 6, `+${COIN_POINTS}`)
      coin.destroy()
      playSfx(this, "coin", 0.5)
      this.coinsTaken++
      this.registry.inc("score", COIN_POINTS)
    })
    this.physics.add.overlap(this.player, this.chasers, (_p, c) => this.touchChaser(c as Chaser))
    this.physics.add.overlap(this.player, checkpoints, (_p, obj) =>
      this.reachCheckpoint(obj as Phaser.Physics.Arcade.Image),
    )
    if (flag) this.physics.add.overlap(this.player, flag, () => this.win())

    // ---------- camera ----------
    const camera = this.cameras.main
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels).setZoom(CAMERA.zoom)
    camera.startFollow(this.player, true, CAMERA.lerp, CAMERA.lerp)
    camera.setDeadzone(30, 24)
    fadeIn(this)

    // ---------- input ----------
    const hud = () => this.scene.get("hud") as HudScene
    this.controls = new Controls(this, () => hud().touch, true)
    const resume = () => this.controls.reset()
    this.events.on("resume", resume)
    this.events.once("shutdown", () => this.events.off("resume", resume))

    // ---------- sound + HUD ----------
    playMusic(this, "music", 0.35)
    this.scene.launch("hud")
    platform.gameplayStart()
    track("level_start", { level: this.level + 1 })
  }

  update(time: number, delta: number) {
    if (this.finished) return
    const dt = Math.min(delta, 50)
    this.controls.update()
    if (this.controls.justPressed("pause")) return this.pause()

    this.player.step(this.controls, time, dt)
    for (const chaser of this.chasers.getChildren() as Chaser[]) chaser.step(this.player, dt)
    for (const hint of this.hints) {
      const near = Phaser.Math.Distance.Between(this.player.x, this.player.y, hint.x, hint.y) < 80
      hint.text.alpha += ((near ? 1 : 0) - hint.text.alpha) * 0.12
    }

    // Water and spikes (tile property hazard): back to the last checkpoint
    const tile = this.walls.getTileAtWorldXY(this.player.x, this.player.y + 6)
    if (tile?.properties?.hazard) this.hurt(time, this.player.x, this.player.y, true, "hazard")
  }

  /** Open the pause screen over the level (Esc / P / Start / the HUD pause button) */
  pause() {
    if (this.finished || this.scene.isActive("pause")) return
    this.scene.launch("pause")
    this.scene.pause()
    this.scene.pause("hud")
    platform.gameplayStop()
  }

  private addHint(x: number, y: number, key: Key) {
    if (!key) return
    const text = this.add
      .text(x, y, t(key), {
        fontFamily: "system-ui, sans-serif",
        fontSize: "9px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#1d1630",
        strokeThickness: 3,
        align: "center",
        wordWrap: { width: 150 },
        resolution: 4,
      })
      .setOrigin(0.5, 1)
      .setDepth(8)
      .setAlpha(0)
    this.hints.push({ text, x, y })
  }

  private reachCheckpoint(point: Phaser.Physics.Arcade.Image) {
    if (point.getData("reached")) return
    point.setData("reached", true).clearTint().setAlpha(1)
    this.spawn.set(point.x, point.y + 12)
    this.fx.sparks(point.x, point.y, 0xffffff, 16)
    this.fx.popText(point.x, point.y - 14, t("checkpoint"), "#ffffff")
    playSfx(this, "coin", 0.5, { variation: 0 })
    track("checkpoint", { level: this.level + 1, x: Math.round(point.x) })
  }

  private touchChaser(chaser: Chaser) {
    // A dash goes through and defeats the slime
    if (this.player.isDashing()) {
      this.fx.sparks(chaser.x, chaser.y, 0x8be04e, 16)
      this.fx.popText(chaser.x, chaser.y - 10, `+${DASH_POINTS}`)
      this.fx.hitstop()
      this.fx.shake(FX.shake / 2, 100)
      chaser.destroy()
      playSfx(this, "coin", 0.5)
      this.registry.inc("score", DASH_POINTS)
      return
    }
    this.hurt(this.time.now, chaser.x, chaser.y, false, "slime")
  }

  private hurt(time: number, fromX: number, fromY: number, respawn: boolean, cause: string) {
    if (this.player.isInvulnerable(time) && !respawn) return
    if (cheats.god) {
      if (respawn) this.player.respawn(this.spawn.x, this.spawn.y)
      return
    }
    playSfx(this, "hurt", 0.5)
    this.fx.hitstop(FX.hitstop * 1.5)
    this.fx.shake()
    this.player.hurt(time, fromX, fromY)
    this.damage++
    track("death", { level: this.level + 1, cause, x: Math.round(this.player.x), y: Math.round(this.player.y) })

    const { lives, gameOver } = loseLife(this.registry.get("lives") as number)
    this.registry.set("lives", lives)
    if (gameOver) return this.finish(false)
    if (respawn) this.player.respawn(this.spawn.x, this.spawn.y)
  }

  /** The flag is reached (the dev tools call it to skip a level) */
  win() {
    playSfx(this, "win", 0.6, { variation: 0 })
    this.fx.sparks(this.player.x, this.player.y - 10, 0xffffff, 30)
    this.finish(true)
  }

  private finish(won: boolean) {
    if (this.finished) return
    this.finished = true
    this.physics.pause()
    stopMusic(this)
    platform.gameplayStop()

    const score = this.registry.get("score") as number
    const stars = won ? starsFor(this.coinsTaken, this.coinsTotal) : 0
    const level = LEVELS[this.level]
    save.update({
      best: isRecord(score, save.get().best) ? score : save.get().best,
      wallet: save.get().wallet + this.coinsTaken,
      levels: won ? recordResult(save.get().levels, level.key, stars, score) : save.get().levels,
    })
    void platform.submitScore(save.get().best)
    unlockAchievements(this.game, { won, damage: this.damage })
    track(won ? "level_complete" : "game_over", {
      level: this.level + 1,
      score,
      stars,
      seconds: Math.round((this.time.now - this.startedAt) / 1000),
    })

    const result: LevelResultData = { level: this.level, won, score, stars }
    this.time.delayedCall(1200, async () => {
      if (!shop.has(PRODUCTS.noAds)) await platform.showFullscreenAd()
      this.scene.stop("hud")
      if (FEATURES.levelSelect) return goTo(this, "levels", { result })
      const next = this.level + 1
      if (won && next < LEVELS.length) goTo(this, "game", { level: next })
      else goTo(this, "menu", { title: t(won ? "win" : "gameOver"), subtitle: `${t("coins")}: ${score}` })
    })
  }
}
