import type Phaser from "phaser"
import { Pane } from "tweakpane"

import { cheats } from "../cheats"
import { BALANCE, CAMERA, FX, GRAVITY, PLAYER } from "../config"
import { GENRE } from "../genre"
import { LOOK } from "../look"
import { parseReplay, replay } from "../replay"
import type { GameScene } from "../scenes/GameScene"
import { recent } from "../telemetry"
import { createHeatmap } from "./heatmap"

// Dev tools, loaded only by `npm run dev` (see src/main.ts). Never shipped to players.
//   F1 — overlay: FPS, scenes, player state, movement timers, latest analytics events
//   F2 — tuning panel: speed, jump, gravity, camera, effects — live; "Copy" puts the values
//        on the clipboard to paste into content/balance.json
//   F3 — physics hitboxes   F4 — god mode   F6 — win the level
//   F7 — record input from the level start / stop and download replay.json   F8 — play a replay file
//   F9 — death heat map on the level (src/debug/heatmap.ts)   Shift+F9 — add players' deaths from a file

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
      // Any genre's player: position, speed, state machine and movement timers if it has them
      const p = scene.player as unknown as {
        x: number
        y: number
        body: Phaser.Physics.Arcade.Body
        states?: { state?: string }
        move?: Record<string, number | boolean>
      }
      const b = p.body
      lines.push(
        `player ${p.x.toFixed(0)},${p.y.toFixed(0)}  v ${b.velocity.x.toFixed(0)},${b.velocity.y.toFixed(0)}  ${p.states?.state ?? ""}`,
        Object.entries(p.move ?? {})
          .map(([k, v]) => `${k} ${typeof v === "number" ? v.toFixed(Number.isInteger(v) ? 0 : 2) : v}`)
          .join("  "),
      )
    }
    const rec = replay.isRecording ? "REC ●" : replay.isPlaying ? "REPLAY ▶" : "off"
    lines.push(
      `god ${cheats.god ? "ON" : "off"}   hitboxes ${hitboxes ? "ON" : "off"}   replay ${rec}   ${heatmap.label()}`,
      "— events —",
    )
    for (const e of recent.slice(-6)) lines.push(`${(e.time / 1000).toFixed(1)}s ${e.name} ${JSON.stringify(e.data)}`)
    overlay.textContent = lines.join("\n")
  }
  game.events.on("poststep", renderOverlay)

  // ---------- F2: tuning panel ----------
  const world = { gravity: GRAVITY }
  const pane = new Pane({ title: "Tuning (F2)" })
  pane.hidden = true
  // The genre's movement numbers (PLAYER for the platformer, HERO for top-down): a slider per number,
  // range from 0 to 4× the starting value
  const player = pane.addFolder({ title: "Player" })
  const tuning = GENRE.tuning as Record<string, number>
  for (const [key, value] of Object.entries(tuning)) {
    if (typeof value !== "number") continue
    const max = value === 0 ? 1 : Math.abs(value) * 4
    player.addBinding(tuning, key, { min: 0, max, step: max <= 4 ? 0.01 : 1 })
  }
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
  pane.addButton({ title: "Copy values for content/balance.json" }).on("click", () => {
    const balance = { ...BALANCE, WORLD: { ...BALANCE.WORLD, gravity: world.gravity }, PLAYER, CAMERA, FX }
    const text = [
      `// content/balance.json\n${JSON.stringify(balance, null, 2)}`,
      ...(GENRE.name === "platformer" ? [] : [`// HERO in src/topdown.ts\n${JSON.stringify(GENRE.tuning, null, 2)}`]),
      `// src/look.ts\nexport const LOOK = ${JSON.stringify(LOOK)}`,
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

  // ---------- F9: death heat map ----------
  const heatmap = createHeatmap(game)
  pane.addButton({ title: "Clear death heat map" }).on("click", () => heatmap.clear())

  // ---------- F7 / F8: input replays (src/replay.ts) ----------
  const toggleRecording = () => {
    const scene = level()
    if (replay.isRecording) {
      const data = replay.stopRecording()
      if (!data) return
      const link = document.createElement("a")
      link.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }))
      link.download = `replay-level${data.level + 1}-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(link.href)
      console.info(`[replay] ${(data.duration / 1000).toFixed(1)} s, ${data.events.length} input changes saved`)
    } else if (scene) {
      replay.startRecording(scene.level)
      scene.scene.restart({ level: scene.level })
      console.info("[replay] recording from the level start; F7 again to stop")
    }
  }
  const openReplay = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json,application/json"
    input.onchange = async () => {
      const data = parseReplay((await input.files?.[0]?.text()) ?? "")
      if (!data) return console.warn("[replay] not a replay file")
      replay.startPlayback(data)
      // From whatever screen is open: stop it and start the recorded level
      for (const s of game.scene.getScenes(true)) if (s.scene.key !== "toast") s.scene.stop()
      game.scene.start("game", { level: data.level })
      console.info(`[replay] playing ${(data.duration / 1000).toFixed(1)} s`)
    }
    input.click()
  }

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
      F7: toggleRecording,
      F8: openReplay,
      F9: () => (e.shiftKey ? heatmap.open() : heatmap.toggle()),
    }
    const action = actions[e.key]
    if (!action) return
    e.preventDefault()
    action()
    renderOverlay()
  })

  console.info(
    "Dev tools: F1 overlay · F2 tuning · F3 hitboxes · F4 god mode · F6 win · F7 record · F8 replay · F9 heat map",
  )
}
