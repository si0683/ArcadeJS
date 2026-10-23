import type Phaser from "phaser"

import { save } from "./save"

// Every sound goes through these helpers: the player's volume settings (menu) apply to all of them.
// `volume` is the sound's own loudness (0…1); the setting scales it.

/** A sound effect: jump, coin, hit */
export function playSfx(scene: Phaser.Scene, key: string, volume = 1) {
  const level = volume * save.get().settings.sound
  if (level > 0) scene.sound.play(key, { volume: level })
}

/** Own loudness of every music track that is playing, to re-apply the setting when it changes */
const musicVolume = new WeakMap<Phaser.Sound.BaseSound, number>()

/** Looped music; returns the sound so the caller can stop it */
export function playMusic(scene: Phaser.Scene, key: string, volume = 1) {
  const music = scene.sound.add(key, { loop: true, volume: volume * save.get().settings.music })
  musicVolume.set(music, volume)
  music.play()
  return music
}

/** The music setting changed (pause menu): apply it to the music already playing */
export function updateMusicVolume(scene: Phaser.Scene) {
  for (const sound of scene.sound.getAllPlaying()) {
    const volume = musicVolume.get(sound)
    if (volume !== undefined) (sound as Phaser.Sound.WebAudioSound).setVolume(volume * save.get().settings.music)
  }
}
