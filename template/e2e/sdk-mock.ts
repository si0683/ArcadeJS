import type { Page } from "@playwright/test"

// Fake portal SDKs for browser checks (Yandex, CrazyGames, Poki, GamePush). Builds made with --sdk=…
// load the portal's script; the checks serve these mocks instead (no network, no real ads) and record
// which SDK methods the game called in window.sdkCalls. VK Bridge is bundled and works only inside VK,
// so a --sdk=vk build runs here in its no-SDK mode.

const RECORD = `
window.sdkCalls = []
const call = (name) => window.sdkCalls.push(name)
`

const YANDEX = `${RECORD}
window.YaGames = {
  init: async () => ({
    environment: { i18n: { lang: "ru" } },
    features: {
      LoadingAPI: { ready: () => call("ready") },
      GameplayAPI: { start: () => call("gameplayStart"), stop: () => call("gameplayStop") },
    },
    adv: {
      showFullscreenAdv: ({ callbacks }) => { call("fullscreenAd"); callbacks.onOpen?.(); callbacks.onClose?.(true) },
      showRewardedVideo: ({ callbacks }) => { call("rewardedAd"); callbacks.onOpen?.(); callbacks.onRewarded?.(); callbacks.onClose?.() },
    },
    leaderboards: { setScore: async () => call("setScore") },
    getPlayer: async () => ({ getData: async () => ({}), setData: async () => call("setData") }),
    getPayments: async () => ({
      getCatalog: async () => [{ id: "no_ads", title: "Без рекламы", price: "99 ₽" }],
      purchase: async ({ id }) => { call("purchase"); return { productID: id, purchaseToken: "mock-token" } },
      getPurchases: async () => [],
      consumePurchase: async () => call("consumePurchase"),
    }),
    isAvailableMethod: async () => true,
    on: () => {},
  }),
}
`

const CRAZYGAMES = `${RECORD}
window.CrazyGames = {
  SDK: {
    environment: "local",
    init: async () => call("init"),
    game: {
      loadingStart: () => call("loadingStart"),
      loadingStop: () => call("ready"),
      gameplayStart: () => call("gameplayStart"),
      gameplayStop: () => call("gameplayStop"),
    },
    ad: {
      requestAd: (type, callbacks) => { call(type); callbacks.adStarted?.(); callbacks.adFinished?.() },
    },
    data: { getItem: () => null, setItem: () => call("setData") },
  },
}
`

const POKI = `${RECORD}
window.PokiSDK = {
  init: async () => call("init"),
  gameLoadingFinished: () => call("ready"),
  gameplayStart: () => call("gameplayStart"),
  gameplayStop: () => call("gameplayStop"),
  commercialBreak: async (onStart) => { call("commercialBreak"); onStart?.() },
  rewardedBreak: async (onStart) => { call("rewardedBreak"); onStart?.(); return true },
}
`

const GAMEPUSH = `${RECORD}
const products = [{ id: 1, tag: "no_ads", name: "Без рекламы", price: 99, currencySymbol: "₽" }]
const fields = { save: "", score: 0 }
const gp = {
  language: "ru",
  gameStart: async () => call("ready"),
  gameplayStart: async () => call("gameplayStart"),
  gameplayStop: async () => call("gameplayStop"),
  on: () => {},
  ads: {
    isFullscreenAvailable: true,
    isRewardedAvailable: true,
    showFullscreen: async () => { call("fullscreenAd"); return true },
    showRewardedVideo: async () => { call("rewardedAd"); return true },
  },
  player: {
    ready: Promise.resolve(),
    get score() { return fields.score },
    set score(value) { fields.score = value },
    has: (key) => key in fields,
    get: (key) => fields[key],
    set: (key, value) => { fields[key] = value },
    sync: async () => call("setData"),
  },
  payments: {
    isAvailable: true,
    products,
    purchases: [],
    purchase: async ({ tag }) => { call("purchase"); return { product: products.find((p) => p.tag === tag) } },
    consume: async () => call("consumePurchase"),
    getProduct: (idOrTag) => products.find((p) => p.id === idOrTag || p.tag === idOrTag),
  },
}
setTimeout(() => window.onGPInit?.(gp))
`

export async function mockPlatformSdk(page: Page) {
  const serve = (body: string) => ({ status: 200, contentType: "text/javascript", body })
  await page.route("**/sdk.js", (route) => route.fulfill(serve(YANDEX)))
  await page.route("https://sdk.crazygames.com/**", (route) => route.fulfill(serve(CRAZYGAMES)))
  await page.route("https://game-cdn.poki.com/**", (route) => route.fulfill(serve(POKI)))
  for (const host of ["gs.eponesh.com", "s3.gamepush.com", "s3-eu.gamepush.com", "gamepush.com"]) {
    await page.route(`https://${host}/**`, (route) => route.fulfill(serve(GAMEPUSH)))
  }
}

/** SDK methods the game called; null when no portal SDK was loaded (no SDK, or VK outside VK) */
export const sdkCalls = (page: Page) =>
  page.evaluate(() => (window as unknown as { sdkCalls?: string[] }).sdkCalls ?? null)
