import type Phaser from "phaser"

import { save } from "./save"

// Every sound goes through these helpers: the player's volume settings (menu) apply to all of them.
// `volume` is the sound's own loudness (0…1); the setting scales it.
//
// Effects: a small random pitch change, so the tenth coin in a row does not sound like a machine gun,
// and a limit of copies of the same sound at once. Music: one track at a time with a crossfade between
// scenes, quieter ("ducked") under the pause screen. Fades run on the game clock, so they finish
// even when the scene that started them is gone.

type Sound = Phaser.Sound.WebAudioSound

export interface SfxOptions {
  /** Pitch spread: 0.08 — ±8% (0 — always the same) */
  variation?: number
  /** At most this many copies of the same sound at once */
  limit?: number
}

/** A sound effect: jump, coin, hit */
export function playSfx(scene: Phaser.Scene, key: string, volume = 1, options: SfxOptions = {}) {
  const level = volume * save.get().settings.sound
  if (level <= 0) return
  const { variation = 0.08, limit = 4 } = options
  if (scene.sound.getAll(key).filter((s) => s.isPlaying).length >= limit) return
  // detune is in cents: 100 cents = a semitone ≈ 6% of pitch
  const detune = variation > 0 ? (Math.random() * 2 - 1) * variation * 1600 : 0
  scene.sound.play(key, { volume: level, detune })
}

// ---------- music ----------

let current: { sound: Sound; key: string; volume: number } | undefined
let duck = 1

const musicLevel = (volume: number) => volume * save.get().settings.music * duck

/** Changes a sound's volume over `ms` on the game clock, then calls `done` */
function fade(game: Phaser.Game, sound: Sound, to: number, ms: number, done?: () => void) {
  const from = sound.volume
  let elapsed = 0
  const step = (_time: number, delta: number) => {
    elapsed += delta
    const k = Math.min(1, elapsed / Math.max(1, ms))
    if (!sound.manager) return game.events.off("step", step)
    sound.setVolume(from + (to - from) * k)
    if (k >= 1) {
      game.events.off("step", step)
      done?.()
    }
  }
  game.events.on("step", step)
}

/**
 * Looped music. The same track keeps playing (menu → levels does not restart it);
 * another track crossfades in over `fadeMs`.
 */
export function playMusic(scene: Phaser.Scene, key: string, volume = 1, fadeMs = 600) {
  if (current?.key === key && current.sound.isPlaying) {
    current.volume = volume
    fade(scene.game, current.sound, musicLevel(volume), fadeMs)
    return current.sound
  }
  stopMusic(scene, fadeMs)
  const sound = scene.sound.add(key, { loop: true, volume: 0 }) as Sound
  sound.play()
  current = { sound, key, volume }
  fade(scene.game, sound, musicLevel(volume), fadeMs)
  return sound
}

/** Fades the current music out and frees it */
export function stopMusic(scene: Phaser.Scene, fadeMs = 400) {
  if (!current) return
  const { sound } = current
  current = undefined
  fade(scene.game, sound, 0, fadeMs, () => sound.destroy())
}

/** Quieter music under a pause or a dialog; `false` brings it back */
export function duckMusic(scene: Phaser.Scene, on: boolean) {
  duck = on ? 0.35 : 1
  if (current) fade(scene.game, current.sound, musicLevel(current.volume), 250)
}

/** The music setting changed (settings, pause menu): apply it to the music already playing */
export function updateMusicVolume(scene: Phaser.Scene) {
  if (current) fade(scene.game, current.sound, musicLevel(current.volume), 100)
}
