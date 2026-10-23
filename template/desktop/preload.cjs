// The only bridge between the game page and the desktop app: the game sees `window.desktop` (src/desktop.ts)
const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("desktop", {
  /** Unlocks a Steam achievement by its API name (Steamworks → Stats & Achievements); false without Steam */
  achievement: (id) => ipcRenderer.invoke("steam:achievement", id),
})
