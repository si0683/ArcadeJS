import Phaser from "phaser"

import { CAPTIONS } from "../accessibility"
import { TEXT_STYLE } from "../config"
import { gameEvents } from "../events"
import { t } from "../i18n"
import { VirtualButtons, type Action } from "../input"
import { GENRE } from "../genre"
import { save } from "../save"

// Runs on top of GameScene without camera zoom: score, lives, touch buttons and sound captions.
export class HudScene extends Phaser.Scene {
  /** Touch buttons, read by GameScene's Controls every frame */
  touch = new VirtualButtons()

  constructor() {
    super("hud")
  }

  create() {
    this.touch = new VirtualButtons()
    // A bitmap font (PreloadScene): the score changes often, a BitmapText redraws for free
    const score = this.add.bitmapText(20, 16, "hud", "")
    const hearts = this.add.group()

    const render = () => {
      score.setText(`${t("coins")}: ${this.registry.get("score")}`)
      hearts.clear(true, true)
      for (let i = 0; i < this.registry.get("lives"); i++) {
        hearts.add(this.add.image(this.scale.width - 30 - i * 40, 34, "heart").setScale(2))
      }
    }
    render()
    // registry "changedata" fires whenever GameScene changes score or lives
    this.registry.events.on("changedata", render)
    this.events.once("shutdown", () => this.registry.events.off("changedata", render))

    // Score "pops" when it grows: the eye notices the change
    let last = this.registry.get("score") as number
    const pop = (_parent: unknown, key: string, value: number) => {
      if (key !== "score" || value <= last) return
      last = value
      this.tweens.killTweensOf(score)
      score.setScale(1.25)
      this.tweens.add({ targets: score, scale: 1, duration: 160, ease: "Back.Out" })
    }
    this.registry.events.on("changedata", pop)
    this.events.once("shutdown", () => this.registry.events.off("changedata", pop))

    if (this.sys.game.device.input.touch) this.addTouchButtons()
    this.addCaptions()
  }

  /** Sound captions (settings → accessibility): "[прыжок]" under the play area, fading out */
  private addCaptions() {
    const caption = this.add
      .text(this.scale.width / 2, this.scale.height - 120, "", {
        ...TEXT_STYLE,
        fontSize: "20px",
        strokeThickness: 5,
        backgroundColor: "#1d1630aa",
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
    const off = gameEvents.on("sound", ({ key }) => {
      const text = CAPTIONS[key]
      if (!text || !save.get().settings.captions) return
      caption.setText(t(text)).setAlpha(1)
      this.tweens.killTweensOf(caption)
      this.tweens.add({ targets: caption, alpha: 0, delay: 700, duration: 400 })
    })
    this.events.once("shutdown", off)
  }

  private addTouchButtons() {
    const { width, height } = this.scale
    const button = (x: number, y: number, radius: number, label: string, action: Action) => {
      const b = this.add.circle(x, y, radius, 0xffffff, 0.25).setStrokeStyle(3, 0xffffff, 0.6).setInteractive()
      this.add.text(x, y, label, { ...TEXT_STYLE, fontSize: `${Math.round(radius * 0.74)}px` }).setOrigin(0.5)
      b.on("pointerdown", () => this.touch.press(action))
      b.on("pointerup", () => this.touch.release(action))
      b.on("pointerout", () => this.touch.release(action))
    }
    // Settings → touch controls: two arrow buttons or a joystick
    if (GENRE.joystickOnly || save.get().settings.touch === "joystick") this.addJoystick(110, height - 100)
    else {
      button(80, height - 70, 46, "◀", "left")
      button(190, height - 70, 46, "▶", "right")
    }
    button(width - 90, height - 70, 46, GENRE.actionLabel, "jump")
    button(width / 2, 34, 24, "II", "pause")
  }

  /** A joystick on the left: touch anywhere in the left third and slide */
  private addJoystick(x: number, y: number) {
    const RADIUS = 60
    const DEAD = 14
    const base = this.add.circle(x, y, RADIUS, 0xffffff, 0.15).setStrokeStyle(3, 0xffffff, 0.5)
    const knob = this.add.circle(x, y, 28, 0xffffff, 0.45)
    const zone = this.add.zone(0, this.scale.height / 3, this.scale.width / 3, this.scale.height).setOrigin(0)
    zone.setInteractive()
    let pointerId = -1

    const move = (pointer: Phaser.Input.Pointer) => {
      const dx = Phaser.Math.Clamp(pointer.x - base.x, -RADIUS, RADIUS)
      const dy = Phaser.Math.Clamp(pointer.y - base.y, -RADIUS, RADIUS)
      knob.setPosition(base.x + dx, base.y + dy)
      if (dx < -DEAD) this.touch.press("left")
      else this.touch.release("left")
      if (dx > DEAD) this.touch.press("right")
      else this.touch.release("right")
      // Up/down only for genres that walk in four directions (a platformer jumps with its button)
      if (GENRE.joystickOnly && dy < -DEAD) this.touch.press("up")
      else this.touch.release("up")
      if (GENRE.joystickOnly && dy > DEAD) this.touch.press("down")
      else this.touch.release("down")
    }
    const release = () => {
      pointerId = -1
      knob.setPosition(base.x, base.y)
      for (const action of ["left", "right", "up", "down"] as const) this.touch.release(action)
    }
    zone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointerId = pointer.id
      // The joystick appears where the thumb lands
      base.setPosition(pointer.x, pointer.y)
      move(pointer)
    })
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === pointerId) move(pointer)
    })
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === pointerId) release()
    })
  }
}
