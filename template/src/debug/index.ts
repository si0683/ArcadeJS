import type Phaser from "phaser"
import { Pane } from "tweakpane"

import { cheats } from "../cheats"
import { CAMERA, FX, GRAVITY, PLAYER } from "../config"
import { LOOK } from "../look"
import type { GameScene } from "../scenes/GameScene"
import { recent } from "../telemetry"

// Dev tools, loaded only by `npm run dev` (see src/main.ts). Never shipped to players.
//   F1 — overlay: FPS, scenes, player state, movement timers, latest analytics events
//   F2 — tuning panel: speed, jump, gravity, camera, effects — live; "Copy" puts the values
//        on the clipboard to paste into src/config.ts
//   F3 — physics hitboxes   F4 — god mode   F6 — win the level

export function installDebug(game: Phaser.Game) {
  const level = () => {
    const scene = game.scene.getScene("game") as GameScene | null
    return scene && game.scene.isActive("game") ? scene : undefined
  }

  // ---------- F1: overlay ----------
  const overlay = document.createElement("pre")
  Object.assign(overlay.style, {
    position: "fixed",
    left: "8px",
    bottom: "8px",
    margin: "0",
    padding: "8px 10px",
    font: "12px/1.4 ui-monospace, monospace",
    color: "#e5e7eb",
    background: "rgba(17, 12, 32, 0.82)",
    borderRadius: "6px",
    pointerEvents: "none",
    zIndex: "10",
    display: "none",
  })
  document.body.append(overlay)

  const renderOverlay = () => {
    if (overlay.style.display === "none") return
    const scene = level()
    const lines = [
      `FPS ${game.loop.actualFps.toFixed(0)}   scenes: ${game.scene
        .getScenes(true)
        .map((s) => s.scene.key)
        .join(", ")}`,
    ]
    if (scene) {
      const p = scene.player
      const b = p.body
      lines.push(
        `player ${p.x.toFixed(0)},${p.y.toFixed(0)}  v ${b.velocity.x.toFixed(0)},${b.velocity.y.toFixed(0)}  ${p.states.state}`,
        `coyote ${p.move.coyote.toFixed(0)} ms  buffer ${p.move.buffer.toFixed(0)} ms  floor ${b.blocked.down}`,
      )
    }
    lines.push(`god ${cheats.god ? "ON" : "off"}   hitboxes ${hitboxes ? "ON" : "off"}`, "— events —")
    for (const e of recent.slice(-6)) lines.push(`${(e.time / 1000).toFixed(1)}s ${e.name} ${JSON.stringify(e.data)}`)
    overlay.textContent = lines.join("\n")
  }
  game.events.on("poststep", renderOverlay)

  // ---------- F2: tuning panel ----------
  const world = { gravity: GRAVITY }
  const pane = new Pane({ title: "Tuning (F2)" })
  pane.hidden = true
  const player = pane.addFolder({ title: "Player" })
  player.addBinding(PLAYER, "speed", { min: 40, max: 400, step: 1 })
  player.addBinding(PLAYER, "accel", { min: 100, max: 5000, step: 50 })
  player.addBinding(PLAYER, "decel", { min: 100, max: 5000, step: 50 })
  player.addBinding(PLAYER, "airControl", { min: 0, max: 1, step: 0.05 })
  player.addBinding(PLAYER, "jumpSpeed", { min: 100, max: 800, step: 5 })
  player.addBinding(PLAYER, "jumpCut", { min: 0.1, max: 1, step: 0.05 })
  player.addBinding(PLAYER, "coyoteMs", { min: 0, max: 250, step: 5 })
  player.addBinding(PLAYER, "bufferMs", { min: 0, max: 250, step: 5 })
  player.addBinding(PLAYER, "fallGravity", { min: 1, max: 3, step: 0.05 })
  player.addBinding(PLAYER, "maxFall", { min: 100, max: 1200, step: 10 })
  const physics = pane.addFolder({ title: "World & camera" })
  physics.addBinding(world, "gravity", { min: 100, max: 3000, step: 10 }).on("change", ({ value }) => {
    const scene = level()
    if (scene) scene.physics.world.gravity.y = value
  })
  physics.addBinding(CAMERA, "zoom", { min: 1, max: 5, step: 0.1 }).on("change", ({ value }) => {
    level()?.cameras.main.setZoom(value)
  })
  physics.addBinding(CAMERA, "lookAhead", { min: 0, max: 120, step: 2 })
  const juice = pane.addFolder({ title: "Effects", expanded: false })
  juice.addBinding(FX, "hitstop", { min: 0, max: 250, step: 5 })
  juice.addBinding(FX, "shake", { min: 0, max: 0.03, step: 0.001 })
  juice.addBinding(FX, "squash", { min: 0, max: 0.6, step: 0.01 })
  // The look is built when the level starts: change, then "Restart level"
  juice.addBinding(LOOK, "glowStrength", { min: 0, max: 10, step: 0.5, label: "glow ↻" })
  juice.addBinding(LOOK, "vignetteStrength", { min: 0, max: 0.4, step: 0.01, label: "vignette ↻" })
  juice.addBinding(LOOK, "saturation", { min: -1, max: 1, step: 0.05, label: "saturation ↻" })
  pane.addButton({ title: "Restart level" }).on("click", () => level()?.scene.restart())
  pane.addButton({ title: "Copy values for config.ts" }).on("click", () => {
    const text = [
      `export const GRAVITY = ${world.gravity}`,
      `export const PLAYER: MoveTuning = ${JSON.stringify(PLAYER, null, 2)}`,
      `export const CAMERA = ${JSON.stringify(CAMERA)}`,
      `export const FX = ${JSON.stringify(FX)}`,
      `// src/look.ts
export const LOOK = ${JSON.stringify(LOOK)}`,
    ].join("\n")
    void navigator.clipboard.writeText(text)
  })

  // ---------- F3: hitboxes (kept on through level restarts) ----------
  let hitboxes = false
  const applyHitboxes = () => {
    const scene = level()
    if (!scene) return
    const w = scene.physics.world
    if (!w.debugGraphic) w.createDebugGraphic()
    w.drawDebug = hitboxes
    if (!hitboxes) w.debugGraphic.clear()
  }
  game.scene.getScene("game")?.events.on("create", () => {
    applyHitboxes()
    // A restart builds a new world with the default gravity
    const scene = level()
    if (scene) scene.physics.world.gravity.y = world.gravity
  })

  // ---------- keys ----------
  addEventListener("keydown", (e) => {
    const actions: Record<string, () => void> = {
      F1: () => {
        overlay.style.display = overlay.style.display === "none" ? "block" : "none"
        renderOverlay()
      },
      F2: () => (pane.hidden = !pane.hidden),
      F3: () => {
        hitboxes = !hitboxes
        applyHitboxes()
      },
      F4: () => (cheats.god = !cheats.god),
      F6: () => level()?.win(),
    }
    const action = actions[e.key]
    if (!action) return
    e.preventDefault()
    action()
    renderOverlay()
  })

  console.info("Dev tools: F1 overlay · F2 tuning · F3 hitboxes · F4 god mode · F6 win the level")
}
