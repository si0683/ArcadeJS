// The game as an Android app (Google Play, RuStore, AppGallery) through Capacitor: the same build in a WebView.
//   npm run mobile:init   once: installs Capacitor, creates android/, locks the screen to landscape
//   npm run mobile        build → copy into android/ → open Android Studio (Run ▶ or Build → Generate APK/AAB)
// Needs Node.js 22+ and Android Studio. App id and name: capacitor.config.json. Guide: MOBILE.md.
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"

/** The game is drawn 960×540: landscape, turning with the phone. Portrait games: "sensorPortrait" */
const ORIENTATION = "sensorLandscape"
const VERSION = "^8"

const run = (command, args) => {
  console.log(`> ${command} ${args.join(" ")}`)
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const command = process.argv[2]
if (command === "init") {
  if (Number(process.versions.node.split(".")[0]) < 22) {
    console.error("Capacitor needs Node.js 22 or newer")
    process.exit(1)
  }
  run("npm", ["install", `@capacitor/core@${VERSION}`, `@capacitor/android@${VERSION}`])
  run("npm", ["install", "-D", `@capacitor/cli@${VERSION}`])
  if (!existsSync("dist/index.html")) run("npm", ["run", "build"])
  if (!existsSync("android")) run("npx", ["cap", "add", "android"])
  lockOrientation()
  console.log("\nandroid/ is ready. Next: npm run mobile")
} else if (command === "open") {
  if (!existsSync("android")) {
    console.error("No android/ yet: npm run mobile:init")
    process.exit(1)
  }
  run("npm", ["run", "build"])
  run("npx", ["cap", "sync", "android"])
  run("npx", ["cap", "open", "android"])
} else {
  console.error("Usage: node scripts/mobile.mjs init | open")
  process.exit(1)
}

function lockOrientation() {
  const path = "android/app/src/main/AndroidManifest.xml"
  const xml = readFileSync(path, "utf8")
  if (xml.includes("android:screenOrientation")) return
  writeFileSync(path, xml.replace("<activity", `<activity\n            android:screenOrientation="${ORIENTATION}"`))
  console.log(`Screen orientation: ${ORIENTATION} (${path})`)
}
