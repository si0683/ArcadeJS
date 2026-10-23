// The desktop app (desktop/, Electron) gives the page `window.desktop`; in a browser it is absent and
// these calls do nothing. Achievements with the same ids as in src/achievements.ts reach Steam.

interface DesktopBridge {
  achievement(id: string): Promise<boolean>
}

const bridge = () => (window as unknown as { desktop?: DesktopBridge }).desktop

/** Running as the desktop app (Steam build) */
export const isDesktop = () => bridge() !== undefined

/** Unlocks the Steam achievement with this API name; nothing in a browser or without Steam */
export function desktopAchievement(id: string) {
  void bridge()
    ?.achievement(id)
    .catch(() => {})
}
