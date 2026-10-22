import Phaser from "phaser"

import { playMusic, playSfx } from "../audio"
import { COIN_POINTS, JUMP_SPEED, LIVES, PLAYER_SPEED, SLIME_SPEED, STOMP_POINTS, ZOOM } from "../config"
import { t } from "../i18n"
import { platform } from "../platform"
import { isRecord, isStomp, loseLife } from "../rules"
import { save } from "../save"
import { PRODUCTS, shop } from "../shop"
import type { HudScene } from "./HudScene"

type Body = Phaser.Physics.Arcade.Body
type Sprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody

export class GameScene extends Phaser.Scene {
  private player!: Sprite
  private ground!: Phaser.Tilemaps.TilemapLayer
  private slimes!: Phaser.Physics.Arcade.Group
  private keys!: Record<"left" | "right" | "up" | "a" | "d" | "w" | "space", Phaser.Input.Keyboard.Key>
  private spawn = new Phaser.Math.Vector2()
  private hurtUntil = 0
  private finished = false

  constructor() {
    super("game")
  }

  create() {
    this.finished = false
    this.registry.set({ score: 0, lives: LIVES })

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
    const coins = this.physics.add.staticGroup()
    this.slimes = this.physics.add.group()
    let flag: Phaser.Types.Physics.Arcade.ImageWithStaticBody | undefined

    for (const obj of map.getObjectLayer("objects")?.objects ?? []) {
      const x = obj.x ?? 0
      const y = obj.y ?? 0
      if (obj.name === "player") this.spawn.set(x, y - 12)
      if (obj.name === "coin") coins.create(x, y - 9, "coin")
      if (obj.name === "flag") flag = this.physics.add.staticImage(x, y - 9, "flag")
      if (obj.name === "slime") {
        const slime = this.slimes.create(x, y - 12, "slime") as Sprite
        slime.play("slime-walk").setVelocityX(-SLIME_SPEED).setCollideWorldBounds(true)
        slime.body.setSize(18, 14).setOffset(3, 10)
      }
    }

    // ---------- player ----------
    this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, "player", 0)
    this.player.setCollideWorldBounds(true)
    this.player.body.setSize(14, 20).setOffset(5, 4)

    this.physics.add.collider(this.player, this.ground)
    this.physics.add.collider(this.slimes, this.ground)
    this.physics.add.overlap(this.player, coins, (_p, coin) => {
      ;(coin as Phaser.Physics.Arcade.Image).destroy()
      playSfx(this, "coin", 0.5)
      this.registry.inc("score", COIN_POINTS)
    })
    this.physics.add.overlap(this.player, this.slimes, (_p, slime) => this.touchSlime(slime as Sprite))
    if (flag) this.physics.add.overlap(this.player, flag, () => this.win())

    // ---------- camera ----------
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight).setZoom(ZOOM).startFollow(this.player, true, 0.12, 0.12)

    // ---------- input ----------
    const K = Phaser.Input.Keyboard.KeyCodes
    this.keys = this.input.keyboard!.addKeys({
      left: K.LEFT,
      right: K.RIGHT,
      up: K.UP,
      a: K.A,
      d: K.D,
      w: K.W,
      space: K.SPACE,
    }) as typeof this.keys

    // ---------- sound + HUD ----------
    this.sound.stopAll()
    playMusic(this, "music", 0.35)
    this.scene.launch("hud")
    platform.gameplayStart()
  }

  update(time: number) {
    if (this.finished) return
    const touch = (this.scene.get("hud") as HudScene).touch
    const body = this.player.body
    const left = this.keys.left.isDown || this.keys.a.isDown || touch.left
    const right = this.keys.right.isDown || this.keys.d.isDown || touch.right
    const jump = this.keys.up.isDown || this.keys.w.isDown || this.keys.space.isDown || touch.jump
    const onFloor = body.blocked.down

    if (left) this.player.setVelocityX(-PLAYER_SPEED).setFlipX(true)
    else if (right) this.player.setVelocityX(PLAYER_SPEED).setFlipX(false)
    else this.player.setVelocityX(0)

    if (jump && onFloor) {
      this.player.setVelocityY(-JUMP_SPEED)
      playSfx(this, "jump", 0.4)
    }

    if (!onFloor) this.player.anims.stop()
    else if (left || right) this.player.anims.play("player-walk", true)
    else this.player.anims.stop()

    // Slimes patrol: turn around at walls and at platform edges
    for (const s of this.slimes.getChildren() as Sprite[]) {
      const dir = Math.sign(s.body.velocity.x) || -1
      const ahead = this.ground.getTileAtWorldXY(s.x + dir * 10, s.y + 14)
      if (s.body.blocked.left || s.body.blocked.right || (s.body.blocked.down && !ahead?.collides)) {
        s.setVelocityX(-dir * SLIME_SPEED)
      }
      s.setFlipX(s.body.velocity.x > 0)
    }

    // Hazard tiles (property hazard = true in Tiled): spikes and water
    const tile = this.ground.getTileAtWorldXY(this.player.x, this.player.y + 8)
    if (tile?.properties?.hazard || this.player.y > this.physics.world.bounds.height - 150) {
      this.hurt(time, true)
    }

    this.player.setAlpha(time < this.hurtUntil && Math.floor(time / 80) % 2 ? 0.3 : 1)
  }

  private touchSlime(slime: Sprite) {
    const body = this.player.body as Body
    // Landing on top squashes the slime
    if (isStomp(body.velocity.y, this.player.y, slime.y)) {
      slime.destroy()
      this.player.setVelocityY(-JUMP_SPEED * 0.6)
      playSfx(this, "coin", 0.5)
      this.registry.inc("score", STOMP_POINTS)
    } else {
      this.hurt(this.time.now, false)
    }
  }

  private hurt(time: number, respawn: boolean) {
    if (time < this.hurtUntil && !respawn) return
    this.hurtUntil = time + 1500
    playSfx(this, "hurt", 0.5)
    const { lives, gameOver } = loseLife(this.registry.get("lives") as number)
    this.registry.set("lives", lives)
    this.cameras.main.shake(200, 0.01)
    if (gameOver) return this.finish(t("gameOver"))
    if (respawn) this.player.setPosition(this.spawn.x, this.spawn.y).setVelocity(0, 0)
    else this.player.setVelocityY(-JUMP_SPEED * 0.5)
  }

  private win() {
    playSfx(this, "win", 0.6)
    this.finish(t("win"))
  }

  private finish(title: string) {
    if (this.finished) return
    this.finished = true
    this.physics.pause()
    this.sound.stopByKey("music")
    platform.gameplayStop()

    // Best result: save it and send it to the leaderboard
    const score = this.registry.get("score") as number
    if (isRecord(score, save.get().best)) save.update({ best: score })
    void platform.submitScore(score)

    this.time.delayedCall(1200, async () => {
      // Interstitial ad between rounds (Yandex SDK; without an SDK it resolves at once)
      if (!shop.has(PRODUCTS.noAds)) await platform.showFullscreenAd()
      this.scene.stop("hud")
      this.scene.start("menu", { title, subtitle: `${t("coins")}: ${score}` })
    })
  }
}
