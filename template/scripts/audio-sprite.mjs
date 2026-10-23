// Audio sprite: many short effects in one file — one download instead of dozens (mobile networks,
// portals that count requests) and one decode on iOS. Pure JS, no ffmpeg.
//   art/sfx/<name>/*.wav  →  public/assets/sounds/<name>.wav + <name>.json (Phaser audio sprite)
//   npm run audio:sprite
// Load it in PreloadScene: this.load.audioSprite("sfx", "sounds/sfx.json", ["sounds/sfx.wav"])
// and remove the single files from public/: playSfx(scene, "jump") finds "jump" inside the sprite itself.
// `npm run audio` then makes sfx.ogg / sfx.m4a from sfx.wav (list them instead of the .wav).
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { joinSounds, readWav, writeWav } from "./wav.mjs"

const SOURCE = "art/sfx"
const TARGET = "public/assets/sounds"

if (!existsSync(SOURCE)) {
  console.error(`No ${SOURCE}/: put WAV files into ${SOURCE}/<sprite name>/ (e.g. ${SOURCE}/sfx/jump.wav)`)
  process.exit(1)
}
mkdirSync(TARGET, { recursive: true })
for (const name of readdirSync(SOURCE).filter((n) => statSync(join(SOURCE, n)).isDirectory())) {
  const files = readdirSync(join(SOURCE, name))
    .filter((f) => f.toLowerCase().endsWith(".wav"))
    .sort()
  if (files.length === 0) continue
  const sounds = files.map((f) => ({ name: f.slice(0, -4), sound: readWav(readFileSync(join(SOURCE, name, f))) }))
  const { sound, spritemap } = joinSounds(sounds)
  const wav = writeWav(sound)
  writeFileSync(join(TARGET, `${name}.wav`), wav)
  writeFileSync(join(TARGET, `${name}.json`), JSON.stringify({ resources: [`${name}.wav`], spritemap }, null, 2) + "\n")
  console.log(
    `${TARGET}/${name}.wav: ${files.length} sounds, ${(wav.length / 1024).toFixed(0)} KB (${Object.keys(spritemap).join(", ")})`,
  )
}
