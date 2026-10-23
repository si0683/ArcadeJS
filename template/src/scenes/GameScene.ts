import Phaser from "phaser"

import { playMusic, playSfx } from "../audio"
import { cheats } from "../cheats"
import { CAMERA, COIN_POINTS, FX, LIVES, PLAYER, STOMP_POINTS } from "../config"
import { Player } from "../entities/Player"
import { Slime } from "../entities/Slime"
import { Fx } from "../fx"
import { t } from "../i18n"
import { Controls } from "../input"
import { Look } from "../look"
import { platform } from "../platform"
import { isRecord, isStomp, loseLife } from "../rules"
import { save } from "../save"
import { PRODUCTS, shop } from "../shop"
import { track } from "../telemetry"
import { fadeIn, goTo } from "../transition"
import type { HudScene } from "./HudScene"

export class GameScene extends Phaser.Scene {
  player!: Player
  fx!: Fx
  look!: Look
  private controls!: Controls
  private ground!: Phaser.Tilemaps.TilemapLayer
  private slimes!: Phaser.Physics.Arcade.Group
  private spawn = new Phaser.Math.Vector2()
  private finished = false
  private startedAt = 0

  constructor() {
    super("game")
  }

  create() {
    this.finished = false
    this.startedAt = this.time.now
    this.registry.set({ score: 0, lives: LIVES })
    this.fx = new Fx(this)
    this.look = new Look(this.cameras.main)

    // ---------- level from Tiled ----------
    const map = this.make.tilemap({ key: "level1" })
    // "tiles" = tileset name inside Tiled, second "tiles" = image key from PreloadScene
    const tileset = map.addTilesetImage("tiles", "tiles")!
    map.createLayer("decor", tileset)
    this.ground = map.createLayer("ground", tileset) as Phaser.Tilemaps.TilemapLayer
    // Tiles with the custom property collides = true (set in Tiled) are solid
    this.ground.setCollisionByProperty({ collides: true })

    const worldWidth = map.widthInPixels
    const worldHeight = map.heightInPixels
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight + 200)
    this.physics.world.setBoundsCollision(true, true, true, false) // the bottom stays open: you can fall

    // ---------- objects placed in Tiled (layer "objects", by name) ----------
    // Coins and sparks glow: one filter on a layer instead of one per object
    const glow = this.look.glowLayer().setDepth(4)
    glow.add(this.fx.sparkEmitter)
    const coins = this.physics.add.staticGroup()
    this.slimes = this.physics.add.group()
    let flag: Phaser.Types.Physics.Arcade.ImageWithStaticBody | undefined

    for (const obj of map.getObjectLayer("objects")?.objects ?? []) {
      const x = obj.x ?? 0
      const y = obj.y ?? 0
      if (obj.name === "player") this.spawn.set(x, y - 12)
      if (obj.name === "coin") glow.add(coins.create(x, y - 9, "coin"))
      if (obj.name === "flag") flag = this.physics.add.staticImage(x, y - 9, "flag")
      if (obj.name === "slime") {
        const slime = new Slime(this, x, y - 12)
        this.slimes.add(slime)
        slime.start()
      }
    }

    // ---------- player ----------
    this.player = new Player(this, this.spawn.x, this.spawn.y, this.fx)

    this.physics.add.collider(this.player, this.ground)
    this.physics.add.collider(this.slimes, this.ground)
    this.physics.add.overlap(this.player, coins, (_p, obj) => {
      const coin = obj as Phaser.Physics.Arcade.Image
      this.fx.sparks(coin.x, coin.y)
      this.fx.popText(coin.x, coin.y - 6, `+${COIN_POINTS}`)
      coin.destroy()
      playSfx(this, "coin", 0.5)
      this.registry.inc("score", COIN_POINTS)
    })
    this.physics.add.overlap(this.player, this.slimes, (_p, slime) => this.touchSlime(slime as Slime))
    if (flag) this.physics.add.overlap(this.player, flag, () => this.win())

    // ---------- camera: smooth follow, a dead zone and a look-ahead in the run direction ----------
    const camera = this.cameras.main
    camera.setBounds(0, 0, worldWidth, worldHeight).setZoom(CAMERA.zoom)
    camera.startFollow(this.player, true, CAMERA.lerp, CAMERA.lerp)
    camera.setDeadzone(24, 40)
    camera.followOffset.set(0, 0)
    fadeIn(this)

    // ---------- input: keyboard, gamepad and the HUD touch buttons ----------
    const hud = () => this.scene.get("hud") as HudScene
    this.controls = new Controls(this, () => hud().touch)
    // Back from the pause screen: keys and touches released during the pause must not stay "held"
    const resume = () => this.controls.reset()
    this.events.on("resume", resume)
    this.events.once("shutdown", () => this.events.off("resume", resume))

    // ---------- sound + HUD ----------
    this.sound.stopAll()
    playMusic(this, "music", 0.35)
    this.scene.launch("hud")
    platform.gameplayStart()
    track("level_start", { level: 1 })
  }

  update(time: number, delta: number) {
    if (this.finished) return
    // A long frame (tab switch, debugger) must not throw the player through the floor
    const dt = Math.min(delta, 50)
    this.controls.update()
    if (this.controls.justPressed("pause")) return this.pause()

    this.player.step(this.controls, time, dt)
    for (const slime of this.slimes.getChildren() as Slime[]) slime.step(this.ground)

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
    track("death", { cause, x: Math.round(this.player.x), y: Math.round(this.player.y) })

    const { lives, gameOver } = loseLife(this.registry.get("lives") as number)
    this.registry.set("lives", lives)
    if (gameOver) return this.finish(t("gameOver"), false)
    if (respawn) this.player.respawn(this.spawn.x, this.spawn.y)
  }

  /** The flag is reached (the dev tools call it to skip a level) */
  win() {
    playSfx(this, "win", 0.6)
    this.fx.sparks(this.player.x, this.player.y - 10, 0xffffff, 30)
    this.finish(t("win"), true)
  }

  private finish(title: string, won: boolean) {
    if (this.finished) return
    this.finished = true
    this.physics.pause()
    this.sound.stopByKey("music")
    platform.gameplayStop()

    // Best result: save it and send it to the leaderboard
    const score = this.registry.get("score") as number
    if (isRecord(score, save.get().best)) save.update({ best: score })
    void platform.submitScore(score)
    track(won ? "level_complete" : "game_over", {
      level: 1,
      score,
      seconds: Math.round((this.time.now - this.startedAt) / 1000),
    })

    this.time.delayedCall(1200, async () => {
      // Interstitial ad between rounds (Yandex SDK; without an SDK it resolves at once)
      if (!shop.has(PRODUCTS.noAds)) await platform.showFullscreenAd()
      this.scene.stop("hud")
      goTo(this, "menu", { title, subtitle: `${t("coins")}: ${score}` })
    })
  }
}
