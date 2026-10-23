import Phaser from "phaser"

import { playSfx } from "../audio"
import { TEXT_STYLE } from "../config"
import { starsLabel, t } from "../i18n"
import { Controls } from "../input"
import { isUnlocked, LEVELS, totalStars } from "../levels"
import { save } from "../save"
import { fadeIn, goTo } from "../transition"
import type { LevelResultData } from "./GameScene"

const COLUMNS = 4
const CARD_W = 190
const CARD_H = 120
const GAP = 24
const FOCUS = 0xf59e0b

// Level select: a grid of cards with stars, closed levels show a lock. Arrows / stick / mouse move
// the focus, Enter / A / click starts, Esc / B goes back. After a level it shows the result and
// puts the focus on the next level.
export class LevelSelectScene extends Phaser.Scene {
  private controls!: Controls
  private cards: Phaser.GameObjects.Rectangle[] = []
  private focus = 0

  constructor() {
    super("levels")
  }

  create(data: { result?: LevelResultData }) {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor("#1d1630")
    fadeIn(this)
    this.controls = new Controls(this)
    this.cards = []
    const progress = save.get().levels

    this.add.text(width / 2, 46, t("levels"), { ...TEXT_STYLE, fontSize: "40px" }).setOrigin(0.5)
    this.add
      .text(
        width / 2,
        88,
        `★ ${totalStars(progress)} / ${LEVELS.length * 3}   ·   ${t("wallet")}: ${save.get().wallet}`,
        {
          ...TEXT_STYLE,
          fontSize: "20px",
          color: "#f59e0b",
        },
      )
      .setOrigin(0.5)

    // Result of the level that just ended
    const result = data.result
    if (result) {
      const line = result.won
        ? `${t("levelComplete")}  ${starsLabel(result.stars)}  ·  ${t("coins")}: ${result.score}`
        : `${t("gameOver")}  ·  ${t("coins")}: ${result.score}`
      this.add.text(width / 2, 124, line, { ...TEXT_STYLE, fontSize: "20px" }).setOrigin(0.5)
    }

    // ---------- the grid ----------
    const rows = Math.ceil(LEVELS.length / COLUMNS)
    const columns = Math.min(COLUMNS, LEVELS.length)
    const left = (width - columns * CARD_W - (columns - 1) * GAP) / 2 + CARD_W / 2
    const top = height / 2 - ((rows - 1) * (CARD_H + GAP)) / 2 + 30
    LEVELS.forEach((level, i) => {
      const x = left + (i % COLUMNS) * (CARD_W + GAP)
      const y = top + Math.floor(i / COLUMNS) * (CARD_H + GAP)
      const open = isUnlocked(progress, i)
      const card = this.add
        .rectangle(x, y, CARD_W, CARD_H, open ? 0x2c2450 : 0x241e3a)
        .setStrokeStyle(4, 0x4b3f80)
        .setInteractive({ useHandCursor: open })
      this.add.text(x, y - 30, String(i + 1), { ...TEXT_STYLE, fontSize: "36px" }).setOrigin(0.5)
      this.add
        .text(x, y + 8, t(level.title), { ...TEXT_STYLE, fontSize: "15px", strokeThickness: 4 })
        .setOrigin(0.5)
        .setAlpha(open ? 1 : 0.5)
      this.add
        .text(x, y + 36, open ? starsLabel(progress[level.key]?.stars ?? 0) : `🔒 ${t("locked")}`, {
          ...TEXT_STYLE,
          fontSize: "20px",
          color: open ? "#f59e0b" : "#a69fc2",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
      card.on("pointerover", () => this.setFocus(i))
      card.on("pointerdown", () => this.start(i))
      this.cards.push(card)
    })

    const back = this.add
      .text(24, height - 24, `← ${t("back")}  [Esc]`, { ...TEXT_STYLE, fontSize: "18px", strokeThickness: 4 })
      .setOrigin(0, 1)
      .setInteractive({ useHandCursor: true })
    back.on("pointerdown", () => goTo(this, "menu"))

    // Focus: the next level after a win, otherwise the level just played or the last open one
    let focus = 0
    LEVELS.forEach((_level, i) => {
      if (isUnlocked(progress, i)) focus = i
    })
    if (result) focus = result.won && isUnlocked(progress, result.level + 1) ? result.level + 1 : result.level
    this.setFocus(Math.max(0, focus))
  }

  update() {
    this.controls.update()
    const c = this.controls
    if (c.justPressed("left")) this.moveFocus(-1)
    if (c.justPressed("right")) this.moveFocus(1)
    if (c.justPressed("up")) this.moveFocus(-COLUMNS)
    if (c.justPressed("down")) this.moveFocus(COLUMNS)
    if (c.justPressed("confirm")) this.start(this.focus)
    if (c.justPressed("pause")) goTo(this, "menu")
  }

  private moveFocus(step: number) {
    const next = this.focus + step
    if (next >= 0 && next < LEVELS.length) this.setFocus(next)
  }

  private setFocus(i: number) {
    this.focus = i
    this.cards.forEach((card, j) => card.setStrokeStyle(4, j === i ? FOCUS : 0x4b3f80))
  }

  private start(i: number) {
    if (!isUnlocked(save.get().levels, i)) {
      // A closed level: shake the card instead of starting
      this.tweens.add({ targets: this.cards[i], x: this.cards[i].x + 6, duration: 50, yoyo: true, repeat: 2 })
      playSfx(this, "hurt", 0.3, { variation: 0 })
      return
    }
    goTo(this, "game", { level: i })
  }
}
