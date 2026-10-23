import { platform as web } from "./none"
import { loadScript } from "./script"
import type { Platform, Product, Purchase } from "./types"

// VK Play (vkplay.ru): the platform's own JS API for browser games — no third-party SDK.
// Official reference: https://documentation.vkplay.ru (JS API integration,
// https://documentation.vkplay.ru/hotbox/devdocs/pdfcopy/en/1119.pdf). Setup in VKPLAY.md.
//
// The game's id on VK Play (GMRID) comes from .env:  VITE_VKPLAY_APP_ID=12345
// The API is the script vkplay.ru/app/<GMRID>/static/mailru.core.js and its window.iframeApi(callbacks):
// every request (getLoginStatus, paymentFrame…) answers through a callback, not a return value.
// Without the id, outside VK Play, or if the script cannot load, everything works as with no SDK.
//
// What the documented API gives: login status and registration, the payment window (paymentFrame),
// profile and friends. It has no cloud saves, leaderboard or "game ready / gameplay" events — saves stay
// in localStorage of the game's frame, the rest are no-ops. Ads: the documented API has none; some VK Play
// games call `showAds` with an `adsCallback`, so it is used only when the API object really has it
// (ask VK Play support whether ads are enabled for your game).

const APP_ID = import.meta.env.VITE_VKPLAY_APP_ID as string | undefined
/** How long to wait for iframeApi to connect after the script loaded, ms */
const CONNECT_TIMEOUT = 8000
/** After the payment window closes, wait this long for a late paymentReceivedCallback, ms */
const RECEIPT_GRACE = 800

/**
 * Products for sale: VK Play has no catalog for the payment window, the game sends the price itself
 * (in rubles, the documented default). Ids are the same as PRODUCTS in src/shop.ts.
 */
export const VKPLAY_PRODUCTS: Record<string, { title: string; amount: number }> = {
  no_ads: { title: "Убрать рекламу", amount: 99 },
}

/** 0 — not logged in, 1 — logged in but not registered in the game, 2 — registered, 3 — bought (premium) */
type LoginStatus = 0 | 1 | 2 | 3

/** The documented part of the API object (plus the optional showAds) */
interface ExternalApi {
  getLoginStatus(): void
  registerUser(): void
  authUser(): void
  paymentFrame(args: { merchant_param: Record<string, string | number> }): void
  showAds?(args: { interstitial: boolean }): void
}

declare global {
  interface Window {
    iframeApi?: (callbacks: Record<string, unknown>) => Promise<ExternalApi>
  }
}

let api: ExternalApi | undefined
let loginStatus: LoginStatus = 0
const pauseCallbacks: (() => void)[] = []
const resumeCallbacks: (() => void)[] = []
const pause = () => pauseCallbacks.forEach((callback) => callback())
const resume = () => resumeCallbacks.forEach((callback) => callback())

// The API answers through these: a request sets the handler, the callback calls it once
let onLoginStatus: ((status: LoginStatus) => void) | undefined
let onRegistered: ((ok: boolean) => void) | undefined
let onPayment: ((event: "received" | "closed") => void) | undefined
let onAds: ((type: string) => void) | undefined

const callbacks = {
  appid: Number(APP_ID),
  getLoginStatusCallback(status: { status: string; loginStatus?: string | number }) {
    if (status?.status === "ok") loginStatus = Number(status.loginStatus) as LoginStatus
    onLoginStatus?.(loginStatus)
  },
  registerUserCallback(info: { status: string }) {
    onRegistered?.(info?.status === "ok")
  },
  confirmWindowClosedCallback() {
    // The player closed the rules (EULA) window without agreeing
    onRegistered?.(false)
  },
  paymentReceivedCallback() {
    onPayment?.("received")
  },
  paymentWindowClosedCallback() {
    onPayment?.("closed")
  },
  adsCallback(context: { type?: string }) {
    onAds?.(context?.type ?? "")
  },
  // Documented callbacks the game does not use yet
  userInfoCallback() {},
  userProfileCallback() {},
  paymentFrameUrlCallback() {},
  getAuthTokenCallback() {},
  userConfirmCallback() {},
}

/** One request → one callback: getLoginStatus → getLoginStatusCallback */
function requestLoginStatus(): Promise<LoginStatus> {
  return new Promise((resolve) => {
    onLoginStatus = (status) => {
      onLoginStatus = undefined
      resolve(status)
    }
    api!.getLoginStatus()
  })
}

/** Payments need a registered player: not logged in → the login window (VK Play reloads the page after it) */
async function ensureRegistered(): Promise<boolean> {
  const status = await requestLoginStatus()
  if (status >= 2) return true
  if (status === 0) {
    api!.authUser()
    return false
  }
  // Logged in but new to this game: the rules window, then registration
  return new Promise((resolve) => {
    onRegistered = (ok) => {
      onRegistered = undefined
      if (ok) loginStatus = 2
      resolve(ok)
    }
    api!.registerUser()
  })
}

// Permanent purchases are remembered in this browser; VK Play reports payments to your server
// (payment notifications, see VKPLAY.md) — check them there before giving anything valuable
const PURCHASES_KEY = "vkplay-purchases"

function readPurchases(): Purchase[] {
  try {
    const list = JSON.parse(localStorage.getItem(PURCHASES_KEY) ?? "[]")
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writePurchases(list: Purchase[]) {
  try {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(list))
  } catch {
    // Blocked storage: the purchase lasts until the page closes
  }
}

/** Shows an ad through the optional showAds and resolves with how it ended */
function playAd(interstitial: boolean): Promise<"completed" | "dismissed" | "error"> {
  return new Promise((resolve) => {
    let completed = false
    const finish = (result: "completed" | "dismissed" | "error") => {
      onAds = undefined
      resume()
      resolve(result)
    }
    onAds = (type) => {
      if (type === "adCompleted") {
        completed = true
        // Some ads report completion without a separate "dismissed"
        setTimeout(() => onAds && finish("completed"), 1200)
      } else if (type === "adDismissed") finish(completed ? "completed" : "dismissed")
      else if (type === "adError") finish("error")
    }
    pause()
    api!.showAds!({ interstitial })
  })
}

export const platform: Platform = {
  name: "vkplay",

  // The documented API does not report a language: the browser's one is used
  get lang() {
    return web.lang
  },

  get features() {
    if (!api) return web.features
    return {
      ads: typeof api.showAds === "function",
      purchases: true,
      leaderboard: false,
    }
  },

  async init() {
    await web.init()
    web.onPause(pause)
    web.onResume(resume)
    if (!APP_ID) {
      console.warn("[platform] VK Play: VITE_VKPLAY_APP_ID is not set — running without the JS API.")
      return
    }
    try {
      if (!(await loadScript(`https://vkplay.ru/app/${encodeURIComponent(APP_ID)}/static/mailru.core.js`))) {
        console.warn("[platform] VK Play JS API did not load — running without it.")
        return
      }
      if (typeof window.iframeApi !== "function") {
        console.warn("[platform] VK Play: no iframeApi — the game is not inside VK Play. Running without it.")
        return
      }
      api = await Promise.race([
        window.iframeApi(callbacks),
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), CONNECT_TIMEOUT)),
      ])
      if (!api) console.warn("[platform] VK Play JS API did not connect — running without it.")
      else void requestLoginStatus()
    } catch (error) {
      api = undefined
      console.warn("[platform] VK Play JS API failed to start — running without it:", error)
    }
  },

  // No loading or gameplay events in the VK Play JS API
  ready() {},
  gameplayStart() {},
  gameplayStop() {},

  async showFullscreenAd() {
    if (api?.showAds) await playAd(true)
  },

  async showRewardedAd() {
    if (!api) return web.showRewardedAd()
    if (!api.showAds) return false
    return (await playAd(false)) === "completed"
  },

  // No cloud saves in the JS API: the save lives in the game frame's localStorage
  loadData: () => web.loadData(),
  saveData: (data) => web.saveData(data),

  async submitScore() {},

  async getProducts() {
    if (!api) return web.getProducts()
    return Object.entries(VKPLAY_PRODUCTS).map(([id, p]): Product => ({
      id,
      title: p.title,
      price: `${p.amount} ₽`,
    }))
  },

  async purchase(productId) {
    if (!api) return web.purchase(productId)
    const product = VKPLAY_PRODUCTS[productId]
    if (!product) {
      console.warn(`[platform] VK Play: no price for "${productId}" in VKPLAY_PRODUCTS (src/platform/vkplay.ts)`)
      return null
    }
    if (!(await ensureRegistered())) return null
    const paid = await new Promise<boolean>((resolve) => {
      let received = false
      onPayment = (event) => {
        if (event === "received") {
          received = true
          onPayment = undefined
          resume()
          resolve(true)
          return
        }
        // Closed: by the player, or automatically after paying — the receipt may still be on its way
        setTimeout(() => {
          if (received) return
          onPayment = undefined
          resume()
          resolve(false)
        }, RECEIPT_GRACE)
      }
      pause()
      api!.paymentFrame({
        merchant_param: {
          amount: product.amount,
          currency: "RUB",
          description: product.title,
          item_id: productId,
        },
      })
    })
    if (!paid) return null
    const purchase: Purchase = {
      productId,
      token: `vkplay-${productId}-${Date.now()}`,
    }
    writePurchases([...readPurchases(), purchase])
    return purchase
  },

  async getPurchases() {
    return api ? readPurchases() : web.getPurchases()
  },

  async consumePurchase(token) {
    if (!api) return web.consumePurchase(token)
    writePurchases(readPurchases().filter((p) => p.token !== token))
  },

  // Payment and ad windows, hidden tabs: all reach the game through these
  onPause(callback) {
    pauseCallbacks.push(callback)
  },

  onResume(callback) {
    resumeCallbacks.push(callback)
  },
}
