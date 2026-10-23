import Phaser from "phaser"

import { ACHIEVEMENTS } from "../achievements"
import { FEATURES, TEXT_STYLE } from "../config"
import { GENRE } from "../genre"
import { effectsLabel, t, volumeLabel } from "../i18n"
import { Controls } from "../input"
import { claimDailyReward } from "../meta"
import { nextVolume, save } from "../save"
import { PRODUCTS, shop } from "../shop"
import { fadeIn, goTo } from "../transition"

export class MenuScene extends Phaser.Scene {
  private controls!: Controls
  private start = () => {}

  constructor() {
    super("menu")
  }

  create(data: { title?: string; subtitle?: string }) {
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor("#1d1630")
    fadeIn(this)

    this.add
      .text(width / 2, height / 2 - 70, data.title ?? t("title"), { ...TEXT_STYLE, fontSize: "56px" })
      .setOrigin(0.5)
    const best = `${t("best")}: ${save.get().best}`
    this.add
      .text(width / 2, height / 2 - 10, data.subtitle ? `${data.subtitle} · ${best}` : best, TEXT_STYLE)
      .setOrigin(0.5)
    const hint = this.add
      .text(width / 2, height / 2 + 60, t("play"), { ...TEXT_STYLE, color: "#f59e0b" })
      .setOrigin(0.5)
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 })
    this.add
      .text(width / 2, height - 40, t(GENRE.controls), {
        ...TEXT_STYLE,
        fontSize: "18px",
        color: "#a69fc2",
      })
      .setOrigin(0.5)

    // ---------- settings: click a button or press S / M / E ----------
    const small = { ...TEXT_STYLE, fontSize: "18px", strokeThickness: 4 }
    const button = (y: number, key: "sound" | "music" | "effects", shortcut: string) => {
      const value = () => save.get().settings[key]
      const label = () =>
        `${key === "effects" ? effectsLabel(save.get().settings.effects) : volumeLabel(key, save.get().settings[key])}  [${shortcut}]`
      const text = this.add
        .text(width - 20, y, label(), small)
        .setOrigin(1, 0)
        .setInteractive({ useHandCursor: true })
      const change = () => {
        // Settings save after a second of quiet: clicking through the levels is one write
        const next = key === "effects" ? !value() : nextVolume(value() as number)
        save.update({ settings: { [key]: next } }, 1000)
        text.setText(label())
      }
      text.on("pointerdown", change)
      text.on("pointerover", () => text.setColor("#f59e0b"))
      text.on("pointerout", () => text.setColor("#ffffff"))
      return { change, code: `Key${shortcut}` }
    }
    const settings = [button(16, "sound", "S"), button(46, "music", "M"), button(76, "effects", "E")]

    // All settings (language, fullscreen, keys, touch controls) on their own screen: click or O
    const openSettings = () => goTo(this, "settings")
    const more = this.add
      .text(width - 20, 106, `⚙ ${t("settings")}  [O]`, small)
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
    more.on("pointerdown", openSettings)
    more.on("pointerover", () => more.setColor("#f59e0b"))
    more.on("pointerout", () => more.setColor("#ffffff"))
    settings.push({ change: openSettings, code: "KeyO" })

    // Daily reward first: the piggy bank below already shows it
    claimDailyReward(this.game)
    // Piggy bank and achievements
    const stats = [`${t("wallet")}: ${save.get().wallet}`]
    if (FEATURES.achievements) stats.push(`🏆 ${save.get().achievements.length}/${ACHIEVEMENTS.length}`)
    this.add.text(20, height - 80, stats.join("   "), { ...small, color: "#a69fc2" })
    // Build version (package.json + git commit): players and testers can say which build they have
    this.add
      .text(width - 8, height - 6, `v${__APP_VERSION__}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "11px",
        color: "#6b6390",
      })
      .setOrigin(1, 1)

    // ---------- shop: "Remove ads" while it is sold here and not bought yet (click or B) ----------
    if (shop.available && !shop.has(PRODUCTS.noAds)) {
      const label = `${t("noAds")} · ${shop.product(PRODUCTS.noAds).price}  [B]`
      const offer = this.add.text(20, 16, label, { ...small, color: "#f59e0b" }).setInteractive({ useHandCursor: true })
      let buying = false
      const buyNoAds = async () => {
        if (buying || shop.has(PRODUCTS.noAds)) return
        buying = true
        // The payment window pauses the game through platform.onPause. After a purchase the offer
        // just disappears: the menu is not restarted, so a quick Enter cannot race with it
        if ((await shop.buy(PRODUCTS.noAds)) && offer.scene) offer.destroy()
        buying = false
      }
      offer.on("pointerdown", buyNoAds)
      settings.push({ change: () => void buyNoAds(), code: "KeyB" })
    }

    // Browsers allow sound only after a click or key press, so the game starts on input
    let started = false
    const start = () => {
      if (started) return
      started = true
      // With the level select the menu opens it; without — the first level starts
      goTo(this, FEATURES.levelSelect ? "levels" : "game")
    }
    this.start = start
    // Gamepad: A or Start begins the game (keys and taps are handled by the listeners below)
    this.controls = new Controls(this)
    // A click outside the settings buttons, or any key except the settings shortcuts
    this.input.on("pointerdown", (_pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length === 0) start()
    })
    // Phaser may hand the same event over twice when several keys arrive in one frame:
    // a toggle (Effects) would flip back. Handle every real key press once
    const handled = new WeakSet<KeyboardEvent>()
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (handled.has(event)) return
      handled.add(event)
      const setting = settings.find((s) => s.code === event.code)
      if (setting) setting.change()
      else start()
    })
  }

  update() {
    this.controls.update()
    if (this.controls.justPressed("confirm")) this.start()
  }
}
