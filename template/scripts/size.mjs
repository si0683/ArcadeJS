// Size budget of the built game (runs after the build in `npm run check`).
// Portals and players on mobile data punish heavy games: the first screen must load fast.
// Raise the limits on purpose, not by accident — this check makes growth visible.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { gzipSync } from "node:zlib"

/** JavaScript the browser downloads, gzipped (Phaser alone is ~350 KB) */
const JS_GZIP_KB = 600
/** Everything in dist/: code, images, sounds, maps */
const TOTAL_MB = 20

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else files.push(path)
  }
}
walk("dist")

let js = 0
let total = 0
const biggest = []
for (const file of files) {
  const data = readFileSync(file)
  total += data.length
  if (file.endsWith(".js")) js += gzipSync(data).length
  biggest.push([relative("dist", file), data.length])
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`
console.log(`JS (gzip): ${kb(js)} of ${JS_GZIP_KB} KB · total: ${(total / 1024 / 1024).toFixed(2)} of ${TOTAL_MB} MB`)
for (const [name, size] of biggest.sort((a, b) => b[1] - a[1]).slice(0, 5))
  console.log(`  ${kb(size).padStart(8)}  ${name}`)

if (js > JS_GZIP_KB * 1024 || total > TOTAL_MB * 1024 * 1024) {
  console.error("Over the size budget (scripts/size.mjs): compress the assets or raise the limit on purpose")
  process.exit(1)
}
