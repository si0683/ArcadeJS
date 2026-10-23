// Aseprite files straight into the game: art/aseprite/<name>.aseprite → public/assets/sprites/<name>.png + .json
// (a packed sheet with animation tags, the format Phaser's load.aseprite reads).
//   npm run art            export the changed files once
//   npm run art -- --watch keep exporting on every save in Aseprite (run next to npm run dev: the game reloads)
// Needs the Aseprite app (https://www.aseprite.org): found in PATH, by the ASEPRITE variable or in the usual
// install folders (Steam included). Load: this.load.aseprite("hero", "sprites/hero.png", "sprites/hero.json"),
// then this.anims.createFromAseprite("hero") — every tag becomes an animation (RECIPES.md → «Анимации из Aseprite»).
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, statSync, watch } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const SOURCE = "art/aseprite"
const TARGET = "public/assets/sprites"

const CANDIDATES = [
  process.env.ASEPRITE,
  "aseprite",
  "C:/Program Files/Aseprite/Aseprite.exe",
  "C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe",
  "/Applications/Aseprite.app/Contents/MacOS/aseprite",
  join(homedir(), "Library/Application Support/Steam/steamapps/common/Aseprite/Aseprite.app/Contents/MacOS/aseprite"),
  join(homedir(), ".steam/steam/steamapps/common/Aseprite/aseprite"),
].filter(Boolean)

const aseprite = CANDIDATES.find((path) => spawnSync(path, ["--version"], { stdio: "ignore" }).status === 0)
if (!aseprite) {
  console.error("Aseprite not found: install it or set ASEPRITE=<path to the executable>")
  process.exit(1)
}
if (!existsSync(SOURCE)) {
  console.error(`No ${SOURCE}/: save your .aseprite files there`)
  process.exit(1)
}
mkdirSync(TARGET, { recursive: true })

const isArt = (name) => /\.(aseprite|ase)$/i.test(name)

/** Exports one file if the PNG is older than the source (or `force`) */
function exportFile(name, force = false) {
  const source = join(SOURCE, name)
  const base = name.replace(/\.(aseprite|ase)$/i, "")
  const png = join(TARGET, `${base}.png`)
  if (!force && existsSync(png) && statSync(png).mtimeMs >= statSync(source).mtimeMs) return
  const result = spawnSync(
    aseprite,
    [
      "-b",
      source,
      "--sheet",
      png,
      "--data",
      join(TARGET, `${base}.json`),
      "--format",
      "json-array",
      "--sheet-type",
      "packed",
      "--list-tags",
      "--inner-padding",
      "1",
    ],
    { stdio: "inherit" },
  )
  console.log(result.status === 0 ? `${name} → ${TARGET}/${base}.png` : `${name}: export failed`)
}

for (const name of readdirSync(SOURCE).filter(isArt)) exportFile(name)

if (process.argv.includes("--watch")) {
  console.log(`Watching ${SOURCE}/ — save in Aseprite and the sprite is exported (Ctrl+C to stop)`)
  const timers = new Map()
  watch(SOURCE, (_event, name) => {
    if (!name || !isArt(name) || !existsSync(join(SOURCE, name))) return
    // Aseprite writes a file in several steps: export once it is quiet
    clearTimeout(timers.get(name))
    timers.set(
      name,
      setTimeout(() => exportFile(name, true), 300),
    )
  })
}
