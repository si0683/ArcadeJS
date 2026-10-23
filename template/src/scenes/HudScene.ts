import Phaser from "phaser"

import { TEXT_STYLE } from "../config"
import { t } from "../i18n"
import { VirtualButtons, type Action } from "../input"

// Runs on top of GameScene without camera zoom: score, lives and touch buttons.
export class HudScene extends Phaser.Scene {
  /** Touch buttons, read by GameScene's Controls every frame */
  touch = new VirtualButtons()

  constructor() {
    super("hud")
  }

  create() {
    this.touch = new VirtualButtons()
    const score = this.add.text(20, 16, "", TEXT_STYLE)
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
    button(80, height - 70, 46, "◀", "left")
    button(190, height - 70, 46, "▶", "right")
    button(width - 90, height - 70, 46, "▲", "jump")
    button(width / 2, 34, 24, "II", "pause")
  }
}
