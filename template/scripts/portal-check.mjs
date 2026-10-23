// Checks the built game (dist/) against what game portals check on moderation, before you upload:
// Yandex Games, VK Games, VK Play, CrazyGames, Poki, itch.io. Behaviour in the browser (no page
// scroll, no context menu, silence in a hidden tab, language) is checked by e2e/portal.spec.ts.
//   npm run portal   — build + this check + the browser check
// Every rule says why; read the portal's own requirements too, they change.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { extname, join, relative } from "node:path"

/** Archive limits: Yandex Games accepts up to 100 MB, but players wait for every megabyte of the first screen */
const MAX_TOTAL_MB = 100
const MAX_FILE_MB = 30
/** Hosts a portal build may load from: portal SDKs and analytics the game connects itself */
const ALLOWED_HOSTS = [
  "yandex.ru",
  "yandex.net",
  "yastatic.net",
  "vk.com",
  "vk.ru",
  "userapi.com",
  "vkplay.ru",
  "mail.ru",
  "crazygames.com",
  "poki.com",
  "poki-cdn.com",
  "poki.io",
  "sentry.io",
  "w3.org",
  "phaser.io",
  "github.com",
  "mozilla.org",
]

const problems = []
const warnings = []
const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else files.push(path)
  }
}
try {
  walk("dist")
} catch {
  console.error("dist/ not found — run npm run build first")
  process.exit(1)
}
const rel = (file) => relative("dist", file).replaceAll("\\", "/")

// The archive root must hold index.html: the portal opens it directly
if (!files.some((f) => rel(f) === "index.html"))
  problems.push("no dist/index.html: the portal opens it from the archive root")

let total = 0
for (const file of files) {
  const size = statSync(file).size
  total += size
  const name = rel(file)
  if (size > MAX_FILE_MB * 1024 * 1024)
    problems.push(`${name}: ${(size / 1048576).toFixed(1)} MB — portals and CDNs reject huge files`)
  // Cyrillic, spaces and odd characters in file names break on some portals' servers
  if (!/^[\w./-]+$/.test(name)) problems.push(`${name}: use latin letters, digits, - and _ in file names`)
  if (name.endsWith(".map"))
    problems.push(`${name}: source maps do not belong in a public build (npm run sentry:sourcemaps removes them)`)
  if (
    [".psd", ".aseprite", ".ase", ".tmx", ".tsx", ".blend", ".wav"].includes(extname(name)) &&
    !name.startsWith("assets/sounds/")
  ) {
    warnings.push(`${name}: a source file in the build — export it or move it out of public/`)
  }
}
if (total > MAX_TOTAL_MB * 1024 * 1024)
  problems.push(`build is ${(total / 1048576).toFixed(1)} MB, portals accept up to ${MAX_TOTAL_MB} MB`)

// Paths: the game is served from a portal sub-folder, so "/assets/…" (from the domain root) breaks
const html = readFileSync(join("dist", "index.html"), "utf8")
for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (m[1].startsWith("/") && !m[1].startsWith("//"))
    problems.push(`index.html: "${m[1]}" starts at the domain root — use relative paths (vite base "./")`)
}
// External resources: portals forbid loading code and assets from foreign servers (and they fail offline)
for (const file of files.filter((f) => /\.(html|js|css|json)$/.test(f))) {
  const text = readFileSync(file, "utf8")
  for (const m of text.matchAll(/["'`(]((?:https?:)?\/\/([a-z0-9.-]+\.[a-z]{2,})[^"'`)\s]*)/gi)) {
    const host = m[2].toLowerCase()
    if (ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) continue
    if (host === "localhost" || host.startsWith("127.") || host.endsWith(".test") || host.endsWith(".example")) continue
    warnings.push(
      `${rel(file)}: link to ${host} — a portal may reject external requests (allowed list in scripts/portal-check.mjs)`,
    )
  }
}
if (!/<meta[^>]+viewport/.test(html)) problems.push("index.html: no viewport meta — the game will be tiny on phones")
if (!/<title>[^<]+<\/title>/.test(html)) warnings.push("index.html: empty <title>")

const unique = (list) => [...new Set(list)]
console.log(`Portal check: ${files.length} files, ${(total / 1048576).toFixed(2)} MB`)
for (const w of unique(warnings)) console.warn(`  ! ${w}`)
for (const p of unique(problems)) console.error(`  ✖ ${p}`)
if (problems.length) process.exit(1)
console.log("  ✔ archive layout, sizes, file names, paths")
