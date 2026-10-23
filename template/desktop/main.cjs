// The game as a desktop app (Windows, macOS, Linux) and for Steam: Electron shows dist/ in its own window.
//   npm run desktop:init    once: installs Electron (+ electron-builder for packaging)
//   npm run desktop         build and play in a window
//   npm run desktop:build   a folder with the app in release/ — upload it to Steam (DESKTOP.md)
// Steam: put the App ID into desktop/steam_appid.txt and install steamworks.js — achievements unlocked in the
// game go to Steam, the Shift+Tab overlay works. Without Steam the app runs the same.
const { app, BrowserWindow, ipcMain, net, protocol } = require("electron")
const { existsSync, readFileSync } = require("node:fs")
const { join } = require("node:path")
const { pathToFileURL } = require("node:url")

const DIST = join(__dirname, "..", "dist")
/** --smoke (or DESKTOP_SMOKE=1): open hidden, check that the game started, exit (CI and `npm run desktop:check`) */
const SMOKE = process.argv.includes("--smoke") || process.env.DESKTOP_SMOKE === "1"

// ---------- Steam (optional) ----------
let steam
function startSteam() {
  const idFile = join(__dirname, "steam_appid.txt")
  const appId = Number(process.env.STEAM_APP_ID ?? (existsSync(idFile) ? readFileSync(idFile, "utf8").trim() : 0))
  if (!appId) return
  try {
    const steamworks = require("steamworks.js")
    steam = steamworks.init(appId)
    steamworks.electronEnableSteamOverlay()
    console.log(`Steam: ${steam.localplayer.getName()}`)
  } catch (error) {
    // Steam is not running or steamworks.js is not installed: play without it
    console.warn("Steam is off:", error.message)
  }
}
ipcMain.handle("steam:achievement", (_event, id) => {
  if (!steam || typeof id !== "string") return false
  return steam.achievement.activate(id)
})

// The game is served from app://game/ instead of file://: modules, localStorage and fetch work as on a site
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 640,
    minHeight: 360,
    show: !SMOKE,
    backgroundColor: "#1d1630",
    autoHideMenuBar: true,
    webPreferences: { preload: join(__dirname, "preload.cjs"), contextIsolation: true, sandbox: true },
  })
  win.removeMenu()
  // F11 / Alt+Enter — fullscreen, as players expect from a PC game
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return
    if (input.key === "F11" || (input.alt && input.key === "Enter")) {
      win.setFullScreen(!win.isFullScreen())
      event.preventDefault()
    }
  })
  void win.loadURL("app://game/index.html")
  if (SMOKE) {
    win.webContents.on("console-message", (details) => {
      if (details.level === "error") console.error("[game]", details.message)
    })
    setTimeout(async () => {
      const ok = await win.webContents.executeJavaScript("!!document.querySelector('#game canvas')")
      console.log(ok ? "Desktop smoke check: the game is running" : "Desktop smoke check: no game canvas")
      app.exit(ok ? 0 : 1)
    }, 4000)
  }
}

app.whenReady().then(() => {
  protocol.handle("app", (request) => {
    const path = decodeURIComponent(new URL(request.url).pathname)
    const file = join(DIST, path)
    // Only files inside dist/
    if (!file.startsWith(DIST)) return new Response("Not found", { status: 404 })
    return net.fetch(pathToFileURL(file).toString())
  })
  startSteam()
  createWindow()
})
app.on("window-all-closed", () => app.quit())
