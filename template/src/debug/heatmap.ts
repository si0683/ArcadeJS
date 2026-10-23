import type Phaser from "phaser"

import { addSink, type TelemetryEvent } from "../telemetry"

// Death heat map (dev tools, F9): every "death" event (src/telemetry.ts: level, cause, x, y) is a dot on
// the level, coloured by cause. Clusters show where a level is unfair: a jump too long, a hidden spike,
// an enemy right after a checkpoint. Your own deaths in `npm run dev` are kept in localStorage;
// Shift+F9 adds a file with players' deaths — exported by the game server (GET /deaths, server/README.md)
// or any JSON array of death events.

export interface Death {
  /** 1-based, as in the events */
  level: number
  x: number
  y: number
  cause: string
}

const KEY = "gm-heatmap"
const MAX = 5000
/** Dot colours by cause; anything else is red */
export const CAUSE_COLORS: Record<string, number> = { hazard: 0x3b82f6, fall: 0xa855f7, slime: 0x22c55e }

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined)

/** Deaths from a file: Death[], telemetry events [{ name: "death", data }] or { deaths: [...] } */
export function parseDeaths(json: unknown): Death[] {
  const list = Array.isArray(json)
    ? json
    : Array.isArray((json as { deaths?: unknown })?.deaths)
      ? (json as { deaths: unknown[] }).deaths
      : []
  const deaths: Death[] = []
  for (const item of list) {
    if (!item || typeof item !== "object") continue
    const e = item as Partial<TelemetryEvent> & Record<string, unknown>
    if (e.name !== undefined && e.name !== "death") continue
    const d = (e.data ?? e) as Record<string, unknown>
    const level = num(d.level)
    const x = num(d.x)
    const y = num(d.y)
    if (level === undefined || x === undefined || y === undefined) continue
    deaths.push({ level, x, y, cause: typeof d.cause === "string" ? d.cause : "" })
  }
  return deaths
}

export function createHeatmap(game: Phaser.Game) {
  let deaths: Death[] = []
  try {
    deaths = parseDeaths(JSON.parse(localStorage.getItem(KEY) ?? "[]"))
  } catch {
    deaths = []
  }
  const store = () => {
    deaths = deaths.slice(-MAX)
    try {
      localStorage.setItem(KEY, JSON.stringify(deaths))
    } catch {
      // Full storage: the map still works for this session
    }
  }
  let on = false
  let layer: Phaser.GameObjects.Graphics | undefined

  const scene = () => {
    const s = game.scene.getScene("game") as (Phaser.Scene & { level: number }) | null
    return s && game.scene.isActive("game") ? s : undefined
  }

  const draw = () => {
    layer?.destroy()
    layer = undefined
    const s = scene()
    if (!on || !s) return
    layer = s.add.graphics().setDepth(50)
    // Translucent dots: where many overlap the colour gets solid
    for (const d of deaths) {
      if (d.level !== s.level + 1) continue
      layer.fillStyle(CAUSE_COLORS[d.cause] ?? 0xef4444, 0.3).fillCircle(d.x, d.y, 7)
    }
  }

  addSink((event) => {
    if (event.name !== "death") return
    deaths.push(...parseDeaths([event]))
    store()
    draw()
  })
  game.scene.getScene("game")?.events.on("create", draw)

  return {
    toggle() {
      on = !on
      draw()
    },
    /** Opens a JSON file with players' deaths and adds them */
    open() {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".json,application/json"
      input.onchange = async () => {
        try {
          const added = parseDeaths(JSON.parse((await input.files?.[0]?.text()) ?? ""))
          deaths.push(...added)
          store()
          on = true
          draw()
          console.info(`[heatmap] +${added.length} deaths from the file`)
        } catch {
          console.warn("[heatmap] not a JSON file")
        }
      }
      input.click()
    },
    clear() {
      deaths = []
      store()
      draw()
    },
    /** For the F1 overlay */
    label() {
      const s = scene()
      const here = s ? deaths.filter((d) => d.level === s.level + 1).length : 0
      return `heatmap ${on ? "ON" : "off"} (${here} here)`
    },
  }
}
