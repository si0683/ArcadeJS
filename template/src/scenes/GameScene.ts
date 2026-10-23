import Phaser from "phaser"

import { applyColorMode, applyGameSpeed, startLives } from "../accessibility"
import { loadLevel } from "../assets"
import { playMusic, playSfx, stopMusic } from "../audio"
import { cheats } from "../cheats"
import { CAMERA, COIN_POINTS, FEATURES, FX, PLAYER, SLIME_SPEED, SPRING_SPEED, STOMP_POINTS } from "../config"
import { MovingPlatform } from "../entities/MovingPlatform"
import { Player } from "../entities/Player"
import { Slime } from "../entities/Slime"
import { gameEvents } from "../events"
import { Fx } from "../fx"
import { t, type Key } from "../i18n"
import { Controls } from "../input"
import { LEVELS, recordResult, starsFor } from "../levels"
import { addLevelLight } from "../lighting"
import { Look } from "../look"
import { unlockAchievements } from "../meta"
import { addParallax } from "../parallax"
import { platform } from "../platform"
import { rng } from "../random"
import { isRecord, isStomp, loseLife } from "../rules"
import { save } from "../save"
import { PRODUCTS, shop } from "../shop"
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

export class GameScene extends Phaser.Scene {
  player!: Player
  fx!: Fx
  look!: Look
  /** Index in LEVELS */
  level = 0
  private controls!: Controls
  private ground!: Phaser.Tilemaps.TilemapLayer
  private slimes!: Phaser.Physics.Arcade.Group
  private platforms: MovingPlatform[] = []
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

  // The map and the level's own assets load when it starts: the first screen does not wait for every level
  preload() {
    loadLevel(this, LEVELS[this.level])
  }

  create() {
    this.finished = false
    this.startedAt = this.time.now
    // Gameplay randomness repeats for the same level and input (replays, golden runs)
    rng.seed(this.level + 1)
    this.coinsTotal = this.coinsTaken = this.damage = 0
    this.platforms = []
    this.hints = []
    // Help (settings → accessibility) adds lives; the game speed setting slows the whole level
    this.registry.set({ score: 0, lives: startLives(), level: this.level, genre: "platformer" })
    applyGameSpeed(this)
    this.fx = new Fx(this)
    this.look = new Look(this.cameras.main)
    applyColorMode(this.cameras.main)

    // ---------- level from Tiled ----------
    const map = this.make.tilemap({ key: LEVELS[this.level].key })
    const worldWidth = map.widthInPixels
    const worldHeight = map.heightInPixels
    if (FEATURES.parallax) addParallax(this, worldWidth, worldHeight)
    // "tiles" = tileset name inside Tiled, second "tiles" = image key from PreloadScene
    const tileset = map.addTilesetImage("tiles", "tiles")!
    map.createLayer("decor", tileset)
    this.ground = map.createLayer("ground", tileset) as Phaser.Tilemaps.TilemapLayer
    // Tiles with the custom property collides = true (set in Tiled) are solid;
    // oneWay = true (planks) — solid only from above: jump through them from below
    this.ground.setCollisionByProperty({ collides: true })
    this.ground.forEachTile((tile) => {
      if (tile.properties?.oneWay) tile.setCollision(false, false, true, false)
    })

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight + 200)
    this.physics.world.setBoundsCollision(true, true, true, false) // the bottom stays open: you can fall

    // ---------- objects placed in Tiled (layer "objects", by name; settings in custom properties) ----------
    // Coins and sparks glow: one filter on a layer instead of one per object
    const glow = this.look.glowLayer().setDepth(4)
    glow.add(this.fx.sparkEmitter)
    const coins = this.physics.add.staticGroup()
    const springs = this.physics.add.staticGroup()
    const checkpoints = this.physics.add.staticGroup()
    this.slimes = this.physics.add.group()
    let flag: Phaser.Types.Physics.Arcade.ImageWithStaticBody | undefined

    for (const obj of map.getObjectLayer("objects")?.objects ?? []) {
      const x = obj.x ?? 0
      const y = obj.y ?? 0
      switch (obj.name) {
        case "player":
          this.spawn.set(x, y - 12)
          break
        case "coin":
          glow.add(coins.create(x, y - 9, "coin"))
          this.coinsTotal++
          break
        case "flag":
          flag = this.physics.add.staticImage(x, y - 9, "flag")
          break
        case "slime": {
          const slime = new Slime(this, x, y - 12)
          this.slimes.add(slime)
          slime.start(prop(obj, "speed", SLIME_SPEED))
          break
        }
        case "spring":
          springs.create(x, y - 6, "spring")
          break
        case "platform":
          this.platforms.push(
            new MovingPlatform(
              this,
              x,
              y,
              obj.width ?? 54,
              prop(obj, "dx", 0),
              prop(obj, "dy", 0),
              prop(obj, "speed", 40),
            ),
          )
          break
        case "checkpoint":
          if (FEATURES.checkpoints) {
            const point = checkpoints.create(x, y - 9, "flag") as Phaser.Physics.Arcade.Image
            point.setTint(0x8a8fa8).setAlpha(0.8)
          }
          break
        case "hint":
          if (FEATURES.hints) this.addHint(x, y, prop(obj, "text", "") as Key)
          break
      }
    }

    // ---------- player ----------
    this.player = new Player(this, this.spawn.x, this.spawn.y, this.fx)

    this.physics.add.collider(this.player, this.ground)
    this.physics.add.collider(this.slimes, this.ground)
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.overlap(this.player, coins, (_p, obj) => {
      const coin = obj as Phaser.Physics.Arcade.Image
      this.fx.sparks(coin.x, coin.y)
      this.fx.popText(coin.x, coin.y - 6, `+${COIN_POINTS}`)
      coin.destroy()
      playSfx(this, "coin", 0.5)
      this.coinsTaken++
      this.registry.inc("score", COIN_POINTS)
    })
    this.physics.add.overlap(this.player, this.slimes, (_p, slime) => this.touchSlime(slime as Slime))
    this.physics.add.overlap(this.player, springs, (_p, obj) => this.bounceOnSpring(obj as Phaser.Physics.Arcade.Image))
    this.physics.add.overlap(this.player, checkpoints, (_p, obj) =>
      this.reachCheckpoint(obj as Phaser.Physics.Arcade.Image),
    )
    if (flag) this.physics.add.overlap(this.player, flag, () => this.win())

    // ---------- camera: smooth follow, a dead zone and a look-ahead in the run direction ----------
    const camera = this.cameras.main
    camera.setBounds(0, 0, worldWidth, worldHeight).setZoom(CAMERA.zoom)
    camera.startFollow(this.player, true, CAMERA.lerp, CAMERA.lerp)
    camera.setDeadzone(24, 40)
    camera.followOffset.set(0, 0)
    fadeIn(this)

    // ---------- input: keyboard, gamepad and the HUD touch controls ----------
    const hud = () => this.scene.get("hud") as HudScene
    this.controls = new Controls(this, () => hud().touch, true)
    // Back from the pause screen: keys and touches released during the pause must not stay "held"
    const resume = () => this.controls.reset()
    this.events.on("resume", resume)
    this.events.once("shutdown", () => this.events.off("resume", resume))

    // A dark level (content/levels.json → "light"): light follows the player
    addLevelLight(this, LEVELS[this.level].light, this.player)

    // ---------- sound + HUD ----------
    playMusic(this, "music", 0.35)
    this.scene.launch("hud")
    platform.gameplayStart()
    // Analytics, the game server and the rest follow the level through its events (src/systems.ts)
    gameEvents.emit("levelStart", { level: this.level, time: this.time.now })
  }

  update(time: number, delta: number) {
    if (this.finished) return
    // A long frame (tab switch, debugger) must not throw the player through the floor
    const dt = Math.min(delta, 50)
    this.controls.update()
    if (this.controls.justPressed("pause")) return this.pause()

    this.player.step(this.controls, time, dt)
    for (const slime of this.slimes.getChildren() as Slime[]) slime.step(this.ground)
    for (const p of this.platforms) p.step()
    this.updateHints()

    // Look-ahead: shift the view towards the run direction, smoothly
    const camera = this.cameras.main
    const vx = this.player.body.velocity.x
    const ahead = Math.abs(vx) < 20 ? 0 : -Math.sign(vx) * CAMERA.lookAhead
    camera.followOffset.x += (ahead - camera.followOffset.x) * 0.04

    // Hazard tiles (property hazard = true in Tiled): spikes and water
    const tile = this.ground.getTileAtWorldXY(this.player.x, this.player.y + 8)
    if (tile?.properties?.hazard) this.hurt(time, true, "hazard")
    else if (this.player.y > this.physics.world.bounds.height - 150) this.hurt(time, true, "fall")
  }

  /** Open the pause screen over the level (Esc / P / Start / the HUD pause button) */
  pause() {
    if (this.finished || this.scene.isActive("pause")) return
    this.scene.launch("pause")
    this.scene.pause()
    this.scene.pause("hud")
    platform.gameplayStop()
  }

  // ---------- tutorial hints: Tiled points "hint" with the property text = an i18n key ----------
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

  private updateHints() {
    for (const hint of this.hints) {
      const near = Math.abs(this.player.x - hint.x) < 70 && Math.abs(this.player.y - hint.y) < 120
      hint.text.alpha += ((near ? 1 : 0) - hint.text.alpha) * 0.12
    }
  }

  private bounceOnSpring(spring: Phaser.Physics.Arcade.Image) {
    // Only when landing on it, not when walking into its side
    if (this.player.body.velocity.y < 0 || this.player.y > spring.y) return
    this.player.bounce(SPRING_SPEED, false)
    this.fx.squash(spring, 0.4)
    this.fx.squash(this.player, -0.3)
    playSfx(this, "jump", 0.6, { variation: 0 })
  }

  private reachCheckpoint(point: Phaser.Physics.Arcade.Image) {
    if (point.getData("reached")) return
    point.setData("reached", true).clearTint().setAlpha(1)
    this.spawn.set(point.x, point.y - 3)
    this.fx.sparks(point.x, point.y - 6, 0xffffff, 16)
    this.fx.popText(point.x, point.y - 18, t("checkpoint"), "#ffffff")
    playSfx(this, "coin", 0.5, { variation: 0 })
    gameEvents.emit("checkpoint", { level: this.level, x: point.x })
  }

  private touchSlime(slime: Slime) {
    // Landing on top squashes the slime
    if (isStomp(this.player.body.velocity.y, this.player.y, slime.y)) {
      this.fx.sparks(slime.x, slime.y, 0x8be04e, 16)
      this.fx.popText(slime.x, slime.y - 10, `+${STOMP_POINTS}`)
      this.fx.hitstop()
      this.fx.shake(FX.shake / 2, 100)
      slime.destroy()
      this.player.bounce(PLAYER.jumpSpeed * 0.6)
      playSfx(this, "coin", 0.5)
      this.registry.inc("score", STOMP_POINTS)
    } else {
      this.hurt(this.time.now, false, "slime")
    }
  }

  private hurt(time: number, respawn: boolean, cause: string) {
    if (this.player.isInvulnerable(time) && !respawn) return
    if (cheats.god) {
      if (respawn) this.player.respawn(this.spawn.x, this.spawn.y)
      return
    }
    playSfx(this, "hurt", 0.5)
    // A hit freezes a little longer than a stomp: it should feel bad
    this.fx.hitstop(FX.hitstop * 1.5)
    this.fx.shake()
    this.player.hurt(time, PLAYER.jumpSpeed * 0.5)
    this.damage++
    gameEvents.emit("death", { level: this.level, cause, x: this.player.x, y: this.player.y })

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
    // Best result, level progress and the coins for the piggy bank — one save
    save.update({
      best: isRecord(score, save.get().best) ? score : save.get().best,
      wallet: save.get().wallet + this.coinsTaken,
      levels: won ? recordResult(save.get().levels, level.key, stars, score) : save.get().levels,
    })
    void platform.submitScore(save.get().best)
    unlockAchievements(this.game, { won, damage: this.damage })
    gameEvents.emit("levelEnd", {
      level: this.level,
      won,
      score,
      stars,
      seconds: Math.round((this.time.now - this.startedAt) / 1000),
      time: this.time.now,
    })

    const result: LevelResultData = { level: this.level, won, score, stars }
    this.time.delayedCall(1200, async () => {
      // Interstitial ad between rounds (portal SDKs; without an SDK it resolves at once)
      if (!shop.has(PRODUCTS.noAds)) await platform.showFullscreenAd()
      this.scene.stop("hud")
      if (FEATURES.levelSelect) return goTo(this, "levels", { result })
      // No level select: straight to the next level, the menu after the last one or after losing
      const next = this.level + 1
      if (won && next < LEVELS.length) goTo(this, "game", { level: next })
      else goTo(this, "menu", { title: t(won ? "win" : "gameOver"), subtitle: `${t("coins")}: ${score}` })
    })
  }
}
