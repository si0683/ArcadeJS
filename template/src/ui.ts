import type Phaser from "phaser"

import { TEXT_STYLE } from "./config"
import type { Controls } from "./input"

// A vertical menu that works with every input: arrows / W S / gamepad d-pad move the focus,
// Enter / Space / gamepad A choose, mouse hover moves the focus, click / tap chooses.
// The focused item is highlighted — the accessibility rule "visible keyboard focus".

export interface MenuItem {
  /** Text; a function when it changes (volume, on/off) */
  label: string | (() => string)
  action: () => void
}

const COLOR = "#ffffff"
const FOCUS = "#f59e0b"

export class MenuList {
  private texts: Phaser.GameObjects.Text[] = []
  private focus = 0

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private items: MenuItem[],
    private controls: Controls,
    gap = 52,
  ) {
    items.forEach((_item, i) => {
      const text = scene.add
        .text(x, y + i * gap, "", { ...TEXT_STYLE, fontSize: "30px" })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
      text.on("pointerover", () => this.setFocus(i))
      text.on("pointerdown", () => this.choose(i))
      this.texts.push(text)
    })
    this.render()
  }

  /** Call from the scene's update() after `controls.update()` */
  update() {
    if (this.controls.justPressed("up")) this.setFocus((this.focus + this.items.length - 1) % this.items.length)
    if (this.controls.justPressed("down")) this.setFocus((this.focus + 1) % this.items.length)
    if (this.controls.justPressed("confirm")) this.choose(this.focus)
  }

  private setFocus(i: number) {
    this.focus = i
    this.render()
  }

  private choose(i: number) {
    this.setFocus(i)
    this.items[i].action()
    this.render()
  }

  private render() {
    this.texts.forEach((text, i) => {
      const { label } = this.items[i]
      const focused = i === this.focus
      text.setText(`${focused ? "▸ " : ""}${typeof label === "function" ? label() : label}`)
      text.setColor(focused ? FOCUS : COLOR)
    })
  }
}
