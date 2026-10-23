import { cloudStorage } from "./backend"
import { parseProgress, type Progress } from "./levels"
import { platform, type Platform } from "./platform"

// Everything the game keeps for the player, in one record: best result, level progress, settings,
// achievements, daily reward. Always save through `save.update()` — it merges the change, so saving
// the record keeps the settings. A new field: add it to Save, DEFAULT_SAVE and parseSave() (with a test).

export interface Settings {
  /** Sound effects volume, 0…1 (0 — off) */
  sound: number
  /** Music volume, 0…1 (0 — off) */
  music: number
  /** Screen shake, flashes, freeze frames and filters (off — calmer picture, weaker devices) */
  effects: boolean
  /** Interface language chosen in the settings; "" — the platform's language */
  lang: string
  /** Touch controls: on-screen buttons or a virtual joystick */
  touch: "buttons" | "joystick"
  /** Keys the player re-assigned in the settings: action → key names (see src/input.ts) */
  keys: Record<string, string[]>
  /** Colour filter for colour blindness or low vision (src/accessibility.ts) */
  colors: ColorMode
  /** Captions for sound effects: "[прыжок]" at the bottom of the screen */
  captions: boolean
  /** Game speed: 1, 0.8 or 0.6 — slower for players who need more time to react */
  gameSpeed: number
  /** Help: two extra lives and "Skip level" in the pause menu */
  assist: boolean
}

export const COLOR_MODES = ["normal", "contrast", "protan", "deutan", "tritan"] as const
export type ColorMode = (typeof COLOR_MODES)[number]
/** Game speeds the settings button cycles through */
export const GAME_SPEEDS = [1, 0.8, 0.6]

export interface Daily {
  /** Last day the reward was taken, "YYYY-MM-DD" ("" — never) */
  last: string
  /** Days in a row */
  streak: number
}

export interface Save {
  /** Best result (0 — none yet) */
  best: number
  /** Coins collected over all runs (the daily reward adds to them) */
  wallet: number
  levels: Progress
  /** Ids of unlocked achievements */
  achievements: string[]
  daily: Daily
  settings: Settings
}

/** Volume levels a settings button cycles through */
export const VOLUME_STEPS = [1, 0.75, 0.5, 0.25, 0]

export const DEFAULT_SETTINGS: Settings = {
  sound: 1,
  music: 1,
  effects: true,
  lang: "",
  touch: "buttons",
  keys: {},
  colors: "normal",
  captions: false,
  gameSpeed: 1,
  assist: false,
}

export const DEFAULT_SAVE: Save = {
  best: 0,
  wallet: 0,
  levels: {},
  achievements: [],
  daily: { last: "", streak: 0 },
  settings: DEFAULT_SETTINGS,
}

const toNumber = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
const toObject = (value: unknown) => (value && typeof value === "object" ? (value as Record<string, unknown>) : {})
const toStrings = (value: unknown) =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string").slice(0, 100) : []

function parseKeys(raw: unknown): Record<string, string[]> {
  const keys: Record<string, string[]> = {}
  for (const [action, names] of Object.entries(toObject(raw))) {
    const list = toStrings(names).slice(0, 4)
    if (list.length > 0) keys[action] = list
  }
  return keys
}

/** Data from the platform (old version, another game, hand-edited) → a valid Save */
export function parseSave(raw: unknown): Save {
  const data = toObject(raw)
  const settings = toObject(data.settings)
  const daily = toObject(data.daily)
  return {
    best: toNumber(data.best, 0, 0, Number.MAX_SAFE_INTEGER),
    wallet: Math.floor(toNumber(data.wallet, 0, 0, Number.MAX_SAFE_INTEGER)),
    levels: parseProgress(data.levels),
    achievements: [...new Set(toStrings(data.achievements))],
    daily: {
      last: typeof daily.last === "string" && /^\d{4}-\d{2}-\d{2}$/.test(daily.last) ? daily.last : "",
      streak: Math.floor(toNumber(daily.streak, 0, 0, 10_000)),
    },
    settings: {
      sound: toNumber(settings.sound, DEFAULT_SETTINGS.sound, 0, 1),
      music: toNumber(settings.music, DEFAULT_SETTINGS.music, 0, 1),
      effects: typeof settings.effects === "boolean" ? settings.effects : DEFAULT_SETTINGS.effects,
      lang: typeof settings.lang === "string" && settings.lang.length <= 5 ? settings.lang : "",
      touch: settings.touch === "joystick" ? "joystick" : "buttons",
      keys: parseKeys(settings.keys),
      colors: COLOR_MODES.includes(settings.colors as ColorMode) ? (settings.colors as ColorMode) : "normal",
      captions: settings.captions === true,
      gameSpeed: GAME_SPEEDS.includes(settings.gameSpeed as number) ? (settings.gameSpeed as number) : 1,
      assist: settings.assist === true,
    },
  }
}

/** The next volume level: 100% → 75% → 50% → 25% → off → 100% */
export function nextVolume(volume: number): number {
  const index = VOLUME_STEPS.findIndex((step) => volume >= step - 0.001)
  return VOLUME_STEPS[(index + 1) % VOLUME_STEPS.length]
}

type Storage = Pick<Platform, "loadData" | "saveData">
export type Patch = Partial<Omit<Save, "settings">> & { settings?: Partial<Settings> }

export function createSaveStore(storage: Storage) {
  let current: Save = parseSave(DEFAULT_SAVE)
  let timer: ReturnType<typeof setTimeout> | undefined

  // A deep copy: the platform may keep the object, the game keeps changing its own
  const write = () => {
    clearTimeout(timer)
    timer = undefined
    return storage.saveData(JSON.parse(JSON.stringify(current)) as Record<string, unknown>)
  }

  return {
    get: (): Save => current,

    async load(): Promise<Save> {
      current = parseSave(await storage.loadData())
      return current
    },

    /**
     * Merge a change and save it. `delay` (ms) groups quick changes into one write —
     * portals limit saves (Yandex: 100 per 5 minutes), so settings buttons pass 1000.
     */
    update(patch: Patch, delay = 0): Save {
      current = parseSave({ ...current, ...patch, settings: { ...current.settings, ...patch.settings } })
      if (delay > 0) {
        clearTimeout(timer)
        timer = setTimeout(() => void write(), delay)
      } else void write()
      return current
    },

    /** Write a delayed change now (before leaving the page) */
    flush: () => (timer ? write() : Promise.resolve()),
  }
}

// On your own site with the game server (VITE_BACKEND_URL) saves also go to the server (src/backend.ts)
export const save = createSaveStore(cloudStorage(platform))
