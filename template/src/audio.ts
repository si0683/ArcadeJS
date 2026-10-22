import type Phaser from "phaser"

import { save } from "./save"

// Every sound goes through these helpers: the player's volume settings (menu) apply to all of them.
// `volume` is the sound's own loudness (0…1); the setting scales it.

/** A sound effect: jump, coin, hit */
export function playSfx(scene: Phaser.Scene, key: string, volume = 1) {
  const level = volume * save.get().settings.sound
  if (level > 0) scene.sound.play(key, { volume: level })
}

/** Looped music; returns the sound so the caller can stop it */
export function playMusic(scene: Phaser.Scene, key: string, volume = 1) {
  const music = scene.sound.add(key, { loop: true, volume: volume * save.get().settings.music })
  music.play()
  return music
}
