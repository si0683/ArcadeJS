#!/usr/bin/env node
// create-gamemonsterjs2d — copies the 2D game starter (Vite + Phaser 4 + Tiled + TypeScript)
// into a new folder and installs its dependencies.
//
//   npm create gamemonsterjs2d@latest my-game
//   npx create-gamemonsterjs2d my-game --template=topdown --sdk=yandex --no-install --no-git

import { spawnSync } from "node:child_process"
import { appendFileSync, cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { basename, join, relative, resolve } from "node:path"
import { createInterface } from "node:readline/promises"
import { fileURLToPath } from "node:url"

const NAME = "GameMonsterJS2D"
const PACKAGE = "gamemonsterjs2d"
const STACK = "Vite · Phaser 4 · Tiled · TypeScript"
const DEFAULT_DIR = "my-game"
const DEV_URL = "http://localhost:5173"
const TIPS = `Уровни правятся в Tiled (https://www.mapeditor.org):
  public/assets/maps/level1.tmj, level2.tmj; список уровней, баланс и тексты — content/*.json`

const TEMPLATE = fileURLToPath(new URL("../template", import.meta.url))
// Optional platform SDKs: sdks/<name>/ = sdk.json + files/ (copied over the template) + append/ (added to docs)
const SDKS = fileURLToPath(new URL("../sdks", import.meta.url))
const sdkList = [
  { name: "none", title: "без SDK" },
  ...(existsSync(SDKS) ? readdirSync(SDKS) : [])
    // Russian portals first, then international ones
    .sort((a, b) => sdkRank(a) - sdkRank(b))
    .map((name) => ({
    name,
    ...JSON.parse(readFileSync(join(SDKS, name, "sdk.json"), "utf8")),
  })),
]
function sdkRank(name) {
  const order = ["yandex", "vk", "vkplay", "crazygames", "poki"]
  return order.includes(name) ? order.indexOf(name) : order.length
}
// Genre templates: templates/<name>/ = template.json + files/ (copied over the platformer) + append/
const GENRES = fileURLToPath(new URL("../templates", import.meta.url))
const genreList = [
  { name: "platformer", title: "платформер (бег, прыжки, уровни сбоку)" },
  ...(existsSync(GENRES) ? readdirSync(GENRES) : []).sort().map((name) => ({
    name,
    ...JSON.parse(readFileSync(join(GENRES, name, "template.json"), "utf8")),
  })),
]
const SKIP = new Set(["node_modules", "dist", "package-lock.json", "test-results", "playwright-report"])
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))

const color = (code) => (text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text)
const bold = color(1)
const dim = color(2)
const green = color(32)
const red = color(31)
const magenta = color(35)

const args = process.argv.slice(2)
const flags = new Set()
let target
let sdk
let genre
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === "--sdk") sdk = args[++i]
  else if (arg.startsWith("--sdk=")) sdk = arg.slice(6)
  else if (arg === "--template") genre = args[++i]
  else if (arg.startsWith("--template=")) genre = arg.slice(11)
  else if (arg.startsWith("-")) flags.add(arg)
  else target ??= arg
}

if (flags.has("-h") || flags.has("--help")) {
  console.log(`
${bold(`create-${PACKAGE}`)} ${dim(version)}

  npm create ${PACKAGE}@latest ${dim("[folder]")} ${dim("[-- --template=<genre> --sdk=<name> --no-install --no-git]")}

  --template=<genre>  game genre: ${genreList.map((g) => `${g.name} (${g.title})`).join(", ")}
  --sdk=<name>   platform SDK: ${sdkList.map((s) => `${s.name} (${s.title})`).join(", ")}
  --no-install   do not run npm install
  --no-git       do not run git init
`)
  process.exit(0)
}

console.log(`\n${magenta(bold(NAME))} ${dim(version)} — ${STACK}\n`)

if (process.stdin.isTTY && (!target || !sdk || !genre)) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  if (!target) target = (await rl.question(`Папка проекта ${dim(`(${DEFAULT_DIR})`)}: `)).trim()
  if (!genre && genreList.length > 1) {
    console.log("Жанр игры:")
    genreList.forEach((g, i) => console.log(`  ${i + 1} — ${g.title}`))
    const answer = (await rl.question(`Выберите ${dim("(1)")}: `)).trim()
    genre = genreList[Number(answer) - 1]?.name ?? (genreList.some((g) => g.name === answer) ? answer : undefined)
  }
  if (!sdk && sdkList.length > 1) {
    console.log("SDK платформы:")
    sdkList.forEach((s, i) => console.log(`  ${i + 1} — ${s.title}`))
    const answer = (await rl.question(`Выберите ${dim("(1)")}: `)).trim()
    sdk = sdkList[Number(answer) - 1]?.name ?? (sdkList.some((s) => s.name === answer) ? answer : undefined)
  }
  rl.close()
}
target ||= DEFAULT_DIR
sdk ||= "none"
genre ||= "platformer"
const genreInfo = genreList.find((g) => g.name === genre)
if (!genreInfo) {
  console.error(red(`Неизвестный жанр «${genre}». Доступны: ${genreList.map((g) => g.name).join(", ")}`))
  process.exit(1)
}
const sdkInfo = sdkList.find((s) => s.name === sdk)
if (!sdkInfo) {
  console.error(red(`Неизвестный SDK «${sdk}». Доступны: ${sdkList.map((s) => s.name).join(", ")}`))
  process.exit(1)
}

const root = resolve(target)
if (existsSync(root) && readdirSync(root).length > 0) {
  console.error(red(`Папка «${target}» не пуста. Укажите новую папку.`))
  process.exit(1)
}

cpSync(TEMPLATE, root, {
  recursive: true,
  filter: (source) => !SKIP.has(basename(source)),
})
// npm never publishes a file called .gitignore, so the template keeps it as _gitignore
renameSync(join(root, "_gitignore"), join(root, ".gitignore"))

const pkgPath = join(root, "package.json")
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
pkg.name = toPackageName(basename(root))

if (genre !== "platformer") {
  const dir = join(GENRES, genre)
  // The genre replaces GameScene, the maps, its entities and src/genre.ts; the rest is shared
  if (existsSync(join(dir, "files"))) cpSync(join(dir, "files"), root, { recursive: true })
  for (const file of genreInfo.append ?? []) {
    appendFileSync(join(root, file), readFileSync(join(dir, "append", file), "utf8"))
  }
}

if (sdk !== "none") {
  const dir = join(SDKS, sdk)
  // Files replace or extend the template (e.g. src/platform/index.ts → the SDK implementation)
  if (existsSync(join(dir, "files"))) cpSync(join(dir, "files"), root, { recursive: true })
  // Text added to the end of the docs (AGENTS.md, README.md, PROMT.md)
  for (const file of sdkInfo.append ?? []) {
    appendFileSync(join(root, file), readFileSync(join(dir, "append", file), "utf8"))
  }
  // Scripts and dependencies of the SDK
  for (const field of ["scripts", "dependencies", "devDependencies"]) {
    if (sdkInfo.package?.[field]) pkg[field] = { ...pkg[field], ...sdkInfo.package[field] }
  }
}
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")

console.log(`${green("✔")} Проект создан: ${bold(root)}`)
console.log(`${green("✔")} Жанр: ${genreInfo.title}`)
console.log(`${green("✔")} SDK: ${sdkInfo.title}`)

const agent = (process.env.npm_config_user_agent ?? "npm").split("/")[0]
const pm = ["pnpm", "yarn", "bun"].includes(agent) ? agent : "npm"

let installed = false
if (!flags.has("--no-install")) {
  console.log(`${dim("…")} Устанавливаю зависимости (${pm} install), это займёт минуту\n`)
  installed = run(pm, ["install"], root)
  console.log(installed ? `\n${green("✔")} Зависимости установлены` : red("✖ Установка не удалась — запустите её вручную"))
}

if (!flags.has("--no-git") && run("git", ["--version"], root, true)) {
  if (run("git", ["init", "-q"], root, true)) console.log(`${green("✔")} Git-репозиторий создан`)
}

const cd = relative(process.cwd(), root) || "."
console.log(`
${bold("Дальше:")}
  cd ${cd.includes(" ") ? `"${cd}"` : cd}${installed ? "" : `\n  ${pm} install`}
  ${pm} run dev          ${dim(`# ${DEV_URL}`)}
${sdkScripts()}  ${pm} run zip          ${dim("# game.zip для публикации")}
  ${pm} run portal       ${dim("# проверка требований площадок перед загрузкой")}
  ${pm} run check        ${dim("# линтер, типы, тесты, сборка, размер — перед коммитом")}

${TIPS}
В игре под ${pm} run dev: F1 — отладка, F2 — ползунки баланса, F3 — хитбоксы, F4 — бессмертие,
F7 — запись прохождения, F8 — воспроизведение, F9 — тепловая карта смертей.
Рецепты (враги, уровни, экраны, эффекты, аналитика, сервер, Android, Steam, доступность): RECIPES.md
`)

function sdkScripts() {
  return Object.keys(sdkInfo.package?.scripts ?? {})
    .map((name) => `  ${pm} run ${name.padEnd(12)} ${dim(`# проверка с SDK «${sdkInfo.title}»`)}\n`)
    .join("")
}

function run(command, commandArgs, cwd, quiet = false) {
  const options = { cwd, stdio: quiet ? "ignore" : "inherit" }
  // npm, pnpm and yarn are .cmd files on Windows and need a shell (fixed arguments only)
  const result =
    process.platform === "win32"
      ? spawnSync([command, ...commandArgs].join(" "), { ...options, shell: true })
      : spawnSync(command, commandArgs, options)
  return result.status === 0
}

function toPackageName(name) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/^[._]/, "")
      .replace(/[^a-z0-9-~]+/g, "-") || DEFAULT_DIR
  )
}
