## Platform: VK Play

This project was created with `--sdk=vkplay`: `src/platform/index.ts` exports the VK Play implementation (`src/platform/vkplay.ts`), wrapped in `guard()`. It uses VK Play's own JS API only (https://documentation.vkplay.ru, JS API integration) — never add a third-party SDK for VK Play. Read `VKPLAY.md`.

- Key: `VITE_VKPLAY_APP_ID` (GMRID) in `.env`. Without it, outside VK Play or when `mailru.core.js` does not load, the platform runs in no-SDK mode.
- Wired: `mailru.core.js` + `window.iframeApi(callbacks)` in `init()`; requests answer through callbacks (`getLoginStatusCallback`, `registerUserCallback`, `paymentReceivedCallback`, `paymentWindowClosedCallback`). Purchases: `paymentFrame({ merchant_param: { amount, currency: "RUB", description, item_id } })` after `ensureRegistered()` (status 0 → `authUser()`, 1 → `registerUser()`); prices live in `VKPLAY_PRODUCTS` (ids = `PRODUCTS` in `src/shop.ts`); bought permanent products are remembered in localStorage — valuable goods must be confirmed by VK Play payment notifications on your server.
- Not in the documented API: cloud saves (localStorage of the game frame is used), leaderboard, loading/gameplay events (no-ops), language (browser). Ads only through the optional `showAds` + `adsCallback` when the API object has it — `platform.features.ads` says so.
- Game code never touches `iframeApi` directly — only `platform`.
