import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { convert, joinSounds, readWav, writeWav } from "./wav.mjs"

describe("WAV tools", () => {
  it("reads the template's sounds, whatever their format", () => {
    for (const name of ["coin", "hurt", "jump", "win"]) {
      const sound = readWav(readFileSync(`public/assets/sounds/${name}.wav`))
      expect(sound.channels[0].length, name).toBeGreaterThan(1000)
      expect(Math.max(...sound.channels[0].map(Math.abs)), name).toBeLessThanOrEqual(1)
    }
  })

  it("writes what it reads", () => {
    const sound = { rate: 22050, channels: [Float32Array.from([0, 0.5, -0.5, 1])] }
    const back = readWav(writeWav(sound))
    expect(back.rate).toBe(22050)
    expect([...back.channels[0]].map((v) => Math.round(v * 100) / 100)).toEqual([0, 0.5, -0.5, 1])
  })

  it("resamples to the target rate", () => {
    const sound = { rate: 22050, channels: [new Float32Array(22050)] }
    expect(convert(sound, 44100, 2).map((c) => c.length)).toEqual([44100, 44100])
  })

  it("joins sounds with gaps and maps where each one is", () => {
    const one = { rate: 1000, channels: [new Float32Array(500)] }
    const { sound, spritemap } = joinSounds(
      [
        { name: "a", sound: one },
        { name: "b", sound: one },
      ],
      { rate: 1000, gap: 0.25 },
    )
    expect(spritemap).toEqual({ a: { start: 0, end: 0.5, loop: false }, b: { start: 0.75, end: 1.25, loop: false } })
    expect(sound.channels[0].length).toBe(1500)
  })
})
