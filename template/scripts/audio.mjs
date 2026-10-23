// Compresses sounds: every WAV in public/assets/sounds gets an OGG (Opus, small) and an M4A (AAC,
// for Safari) next to it. WAV effects are 5–10× bigger than they need to be. Run: npm run audio
//
// Needs ffmpeg in PATH (https://ffmpeg.org/download.html; Windows: winget install ffmpeg).
// Then load both formats — Phaser picks the one the browser plays and the WAV is not downloaded:
//   this.load.audio("jump", ["sounds/jump.ogg", "sounds/jump.m4a"])
// and delete the WAV files (keep the originals outside public/, e.g. in art/sounds/).
import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const DIR = "public/assets/sounds"

if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore", shell: process.platform === "win32" }).status !== 0) {
  console.error("ffmpeg not found: install it (https://ffmpeg.org/download.html, Windows: winget install ffmpeg)")
  process.exit(1)
}

const kb = (path) => `${Math.round(statSync(path).size / 1024)} KB`
for (const name of readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".wav"))) {
  const wav = join(DIR, name)
  const base = wav.slice(0, -4)
  const jobs = [
    [`${base}.ogg`, ["-c:a", "libopus", "-b:a", "64k"]],
    [`${base}.m4a`, ["-c:a", "aac", "-b:a", "96k"]],
  ]
  for (const [target, codec] of jobs) {
    if (existsSync(target)) continue
    const result = spawnSync("ffmpeg", ["-loglevel", "error", "-y", "-i", wav, ...codec, target], { stdio: "inherit" })
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
  console.log(`${name}: ${kb(wav)} → ogg ${kb(`${base}.ogg`)}, m4a ${kb(`${base}.m4a`)}`)
}
