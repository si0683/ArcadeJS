import { afterEach, describe, expect, it, vi } from "vitest"

import { createSaveStore, DEFAULT_SAVE, DEFAULT_SETTINGS, nextVolume, parseSave } from "./save"

describe("parseSave", () => {
  it("gives defaults for empty or broken data", () => {
    expect(parseSave(undefined)).toEqual(DEFAULT_SAVE)
    expect(parseSave("garbage")).toEqual(DEFAULT_SAVE)
    expect(parseSave({ best: "12", settings: null })).toEqual(DEFAULT_SAVE)
  })

  it("keeps valid values and clamps the rest", () => {
    expect(parseSave({ best: 42, settings: { sound: 0.5, music: 0 } })).toEqual({
      ...DEFAULT_SAVE,
      best: 42,
      settings: { ...DEFAULT_SETTINGS, sound: 0.5, music: 0 },
    })
    expect(parseSave({ best: -5, settings: { sound: 3, music: -1 } })).toEqual({
      ...DEFAULT_SAVE,
      settings: { ...DEFAULT_SETTINGS, sound: 1, music: 0 },
    })
    expect(parseSave({ settings: { effects: false } }).settings.effects).toBe(false)
    expect(parseSave({ settings: { effects: "no" } }).settings.effects).toBe(true)
  })

  it("reads saves of the old format ({ best } only)", () => {
    expect(parseSave({ best: 7 })).toEqual({ ...DEFAULT_SAVE, best: 7 })
  })

  it("checks the newer fields: levels, achievements, daily reward, language, keys", () => {
    const save = parseSave({
      wallet: 12.7,
      levels: { level1: { stars: 2, best: 9 } },
      achievements: ["first_win", "first_win", 5],
      daily: { last: "2026-10-23", streak: 3 },
      settings: { lang: "en", touch: "joystick", keys: { jump: ["X", 7], left: "A" } },
    })
    expect(save.wallet).toBe(12)
    expect(save.levels).toEqual({ level1: { stars: 2, best: 9 } })
    expect(save.achievements).toEqual(["first_win"])
    expect(save.daily).toEqual({ last: "2026-10-23", streak: 3 })
    expect(save.settings).toMatchObject({ lang: "en", touch: "joystick", keys: { jump: ["X"] } })
    expect(parseSave({ daily: { last: "yesterday" }, settings: { touch: "wheel" } })).toMatchObject({
      daily: { last: "" },
      settings: { touch: "buttons" },
    })
  })
})

describe("nextVolume", () => {
  it("cycles 100% → 75% → 50% → 25% → off → 100%", () => {
    const seen = [1]
    for (let i = 0; i < 5; i++) seen.push(nextVolume(seen[seen.length - 1]))
    expect(seen).toEqual([1, 0.75, 0.5, 0.25, 0, 1])
  })

  it("snaps an odd value to the next step down", () => {
    expect(nextVolume(0.6)).toBe(0.25)
  })
})

describe("createSaveStore", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const storage = (data: unknown = {}) => ({
    loadData: vi.fn(async () => data as Record<string, unknown>),
    saveData: vi.fn(async () => {}),
  })

  it("loads and normalizes", async () => {
    const store = createSaveStore(storage({ best: 3 }))
    expect(await store.load()).toEqual({ ...DEFAULT_SAVE, best: 3 })
  })

  it("saving the record keeps the settings", async () => {
    const target = storage({ best: 3, settings: { sound: 0.25, music: 0 } })
    const store = createSaveStore(target)
    await store.load()
    store.update({ best: 10 })
    expect(target.saveData).toHaveBeenLastCalledWith(
      expect.objectContaining({ best: 10, settings: { ...DEFAULT_SETTINGS, sound: 0.25, music: 0 } }),
    )
  })

  it("groups quick settings changes into one write", async () => {
    vi.useFakeTimers()
    const target = storage()
    const store = createSaveStore(target)
    store.update({ settings: { sound: 0.75 } }, 1000)
    store.update({ settings: { sound: 0.5 } }, 1000)
    store.update({ settings: { music: 0 } }, 1000)
    expect(target.saveData).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(target.saveData).toHaveBeenCalledTimes(1)
    expect(target.saveData).toHaveBeenCalledWith(
      expect.objectContaining({ settings: { ...DEFAULT_SETTINGS, sound: 0.5, music: 0 } }),
    )
  })

  it("flush writes a delayed change at once", async () => {
    vi.useFakeTimers()
    const target = storage()
    const store = createSaveStore(target)
    store.update({ settings: { music: 0.25 } }, 1000)
    await store.flush()
    expect(target.saveData).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1000)
    expect(target.saveData).toHaveBeenCalledTimes(1)
  })
})

describe("accessibility settings", () => {
  it("keep known values and fall back to the defaults", () => {
    const good = parseSave({ settings: { colors: "deutan", captions: true, gameSpeed: 0.6, assist: true } }).settings
    expect(good).toMatchObject({ colors: "deutan", captions: true, gameSpeed: 0.6, assist: true })
    const bad = parseSave({ settings: { colors: "purple", captions: "yes", gameSpeed: 0.1, assist: 1 } }).settings
    expect(bad).toMatchObject({ colors: "normal", captions: false, gameSpeed: 1, assist: false })
  })
})
