import Phaser from "phaser"

import { TEXT_STYLE } from "../config"
import { pendingToasts } from "../meta"

// Pop-up messages (achievements, daily reward) above every scene. Launched once by PreloadScene and
// kept running; anything calls toast(game, title, text) from src/meta.ts. Messages queue up.
export class ToastScene extends Phaser.Scene {
  private queue: [string, string][] = []
  private showing = false

  constructor() {
    super("toast")
  }

  create() {
    const onToast = (title: string, text: string) => {
      this.queue.push([title, text])
      this.next()
    }
    this.game.events.on("toast", onToast)
    this.events.once("shutdown", () => this.game.events.off("toast", onToast))
    for (const [title, text] of pendingToasts.splice(0)) onToast(title, text)
  }

  private next() {
    if (this.showing) return
    const item = this.queue.shift()
    if (!item) return
    this.showing = true
    // Above scenes started later (game, pause)
    this.scene.bringToTop()

    const [title, text] = item
    const { width } = this.scale
    const box = this.add.container(width / 2, -60)
    const panel = this.add.rectangle(0, 0, 420, 70, 0x1d1630, 0.92).setStrokeStyle(3, 0xf59e0b)
    const head = this.add.text(0, -14, title, { ...TEXT_STYLE, fontSize: "20px", color: "#f59e0b" }).setOrigin(0.5)
    const body = this.add.text(0, 14, text, { ...TEXT_STYLE, fontSize: "18px", strokeThickness: 4 }).setOrigin(0.5)
    box.add([panel, head, body])

    this.tweens.chain({
      targets: box,
      tweens: [
        { y: 50, duration: 280, ease: "Back.Out" },
        { y: 50, duration: 2200 },
        { y: -60, duration: 220, ease: "Cubic.In" },
      ],
      onComplete: () => {
        box.destroy()
        this.showing = false
        this.next()
      },
    })
  }
}
