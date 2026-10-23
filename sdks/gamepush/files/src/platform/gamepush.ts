import { platform as web } from "./none"
import { loadScript } from "./script"
import type { Platform, Product, Purchase, SaveData } from "./types"

// GamePush — one SDK for many portals: VK Play, VK Games, OK, Yandex Games, CrazyGames and others
// (https://docs.gamepush.com/ru/docs/get-start/). The SDK detects the portal by the page address,
// so one build works everywhere GamePush is connected. Setup in GAMEPUSH.md.
//
// Project id and public key come from the GamePush panel through .env:
//   VITE_GAMEPUSH_PROJECT_ID=12345
//   VITE_GAMEPUSH_PUBLIC_TOKEN=abc…
// Without them (or if the SDK cannot load) every method falls back to the no-SDK behaviour.

const PROJECT_ID = import.meta.env.VITE_GAMEPUSH_PROJECT_ID as string | undefined
const PUBLIC_TOKEN = import.meta.env.VITE_GAMEPUSH_PUBLIC_TOKEN as string | undefined
/** The official loader tries these mirrors in order */
const SDK_URLS = [
  "https://gs.eponesh.com/sdk/game-score.js",
  "https://s3.gamepush.com/files/gs/sdk/game-score.js",
  "https://s3-eu.gamepush.com/sdk/game-score.js",
  "https://gamepush.com/sdk/game-score.js",
]
/** Player field (type String) for the save: create it in the panel → Players */
const SAVE_FIELD = "save"
/** How long to wait for the SDK to call back after its script loaded, ms */
const INIT_TIMEOUT = 8000

/** The part of the GamePush SDK this file uses (https://gamepush.com/sdk/docs/) */
interface GamePushProduct {
  id: number
  tag: string
  name: string
  price: number
  currencySymbol: string
}

interface GamePush {
  language: string
  gameStart(): Promise<void>
  gameplayStart(): Promise<void>
  gameplayStop(): Promise<void>
  on(event: "pause" | "resume", handler: () => void): void
  ads: {
    isFullscreenAvailable: boolean
    isRewardedAvailable: boolean
    showFullscreen(): Promise<boolean>
    showRewardedVideo(): Promise<boolean>
  }
  player: {
    ready: Promise<void>
    score: number
    has(key: string): boolean
    get(key: string): string | number | boolean
    set(key: string, value: string | number | boolean): void
    sync(): Promise<void>
  }
  payments: {
    isAvailable: boolean
    products: GamePushProduct[]
    purchases: { productId: number }[]
    purchase(input: { tag: string }): Promise<{ product: GamePushProduct }>
    consume(input: { tag: string }): Promise<unknown>
    getProduct(idOrTag: string | number): GamePushProduct | undefined
  }
}

declare global {
  interface Window {
    onGPInit?: (gp: GamePush) => void
  }
}

let gp: GamePush | undefined
let playing = false
let readySent = false
let warnedNoSaveField = false

/** Loads the SDK from the first mirror that answers and waits for its onGPInit callback */
async function connect(): Promise<GamePush | undefined> {
  const initialized = new Promise<GamePush | undefined>((resolve) => {
    window.onGPInit = resolve
    setTimeout(() => resolve(undefined), INIT_TIMEOUT)
  })
  const query = `?projectId=${encodeURIComponent(PROJECT_ID!)}&publicToken=${encodeURIComponent(PUBLIC_TOKEN!)}&callback=onGPInit`
  for (const url of SDK_URLS) {
    if (await loadScript(url + query)) return initialized
  }
  return undefined
}

/** Products are identified by their tag in the panel — the same ids as PRODUCTS in src/shop.ts */
const toPurchase = (tag: string): Purchase => ({ productId: tag, token: tag })

/** The save field exists only when it was created in the panel */
function hasSaveField(sdk: GamePush) {
  if (sdk.player.has(SAVE_FIELD)) return true
  if (!warnedNoSaveField) {
    warnedNoSaveField = true
    console.warn(
      `[platform] GamePush: no player field "${SAVE_FIELD}" (String) — saves stay in localStorage. See GAMEPUSH.md.`,
    )
  }
  return false
}

export const platform: Platform = {
  name: "gamepush",

  get lang() {
    return gp?.language || web.lang
  },

  get features() {
    if (!gp) return web.features
    return {
      ads: gp.ads.isFullscreenAvailable || gp.ads.isRewardedAvailable,
      purchases: gp.payments.isAvailable,
      leaderboard: true,
    }
  },

  async init() {
    await web.init()
    if (!PROJECT_ID || !PUBLIC_TOKEN) {
      console.warn(
        "[platform] GamePush: VITE_GAMEPUSH_PROJECT_ID / VITE_GAMEPUSH_PUBLIC_TOKEN are not set — running without it.",
      )
      return
    }
    try {
      const sdk = await connect()
      if (!sdk) {
        console.warn("[platform] GamePush SDK did not load — running without it.")
        return
      }
      // The player (saves, purchases) syncs with the server before the game may use it. Wrong keys or
      // a dead server: the SDK may never get ready — then the whole session runs without it, rather
      // than switching to the SDK in the middle of a game
      const ready = await Promise.race([
        sdk.player.ready.then(() => true),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), INIT_TIMEOUT)),
      ])
      if (!ready) {
        console.warn("[platform] GamePush player did not get ready — running without the SDK.")
        return
      }
      gp = sdk
    } catch (error) {
      console.warn("[platform] GamePush SDK failed to start — running without it:", error)
    }
  },

  ready() {
    if (readySent || !gp) return
    readySent = true
    void gp.gameStart()
  },

  gameplayStart() {
    if (playing || !gp) return
    playing = true
    void gp.gameplayStart()
  },

  gameplayStop() {
    if (!playing || !gp) return
    playing = false
    void gp.gameplayStop()
  },

  // GamePush pauses the game itself while an ad plays (the "pause"/"resume" events below)
  async showFullscreenAd() {
    if (gp?.ads.isFullscreenAvailable) await gp.ads.showFullscreen()
  },

  async showRewardedAd() {
    if (!gp) return web.showRewardedAd()
    if (!gp.ads.isRewardedAvailable) return false
    return (await gp.ads.showRewardedVideo()) === true
  },

  async loadData() {
    if (!gp || !hasSaveField(gp)) return web.loadData()
    const value = gp.player.get(SAVE_FIELD)
    if (typeof value !== "string" || value === "") return web.loadData()
    try {
      return JSON.parse(value) as SaveData
    } catch {
      return web.loadData()
    }
  },

  async saveData(data) {
    await web.saveData(data)
    if (!gp || !hasSaveField(gp)) return
    gp.player.set(SAVE_FIELD, JSON.stringify(data))
    await gp.player.sync()
  },

  // Leaderboards in GamePush are built on player fields: the best result goes to "score"
  async submitScore(score) {
    if (!gp || score <= gp.player.score) return
    gp.player.score = score
    await gp.player.sync()
  },

  async getProducts() {
    if (!gp) return web.getProducts()
    if (!gp.payments.isAvailable) return []
    return gp.payments.products.map((p): Product => ({
      id: p.tag,
      title: p.name,
      price: `${p.price} ${p.currencySymbol}`.trim(),
    }))
  },

  async purchase(productId) {
    if (!gp) return web.purchase(productId)
    try {
      const result = await gp.payments.purchase({ tag: productId })
      return result?.product ? toPurchase(productId) : null
    } catch {
      // The player closed the payment window or the payment failed
      return null
    }
  },

  async getPurchases() {
    if (!gp) return web.getPurchases()
    if (!gp.payments.isAvailable) return []
    return gp.payments.purchases
      .map((p) => gp!.payments.getProduct(p.productId)?.tag)
      .filter((tag): tag is string => !!tag)
      .map(toPurchase)
  },

  async consumePurchase(token) {
    if (!gp) return web.consumePurchase(token)
    await gp.payments.consume({ tag: token })
  },

  // Ads and a hidden tab: GamePush sends "pause"/"resume". main.ts subscribes after init()
  onPause(callback) {
    web.onPause(callback)
    gp?.on("pause", callback)
  },

  onResume(callback) {
    web.onResume(callback)
    gp?.on("resume", callback)
  },
}
