
## Platform: GamePush (VK Play and other portals)

This project was created with `--sdk=gamepush`: `src/platform/index.ts` exports the GamePush implementation (`src/platform/gamepush.ts`), wrapped in `guard()`. GamePush detects the portal (VK Play, VK Games, OK, Yandex Games…) by the page address, so one build serves all connected portals. Read `GAMEPUSH.md`.

- Keys: `VITE_GAMEPUSH_PROJECT_ID` and `VITE_GAMEPUSH_PUBLIC_TOKEN` in `.env` (template: `.env.example`). Without them the platform runs in no-SDK mode.
- Wired: SDK script from the official mirrors with `callback=onGPInit`, `await gp.player.ready` in `init()`, `gp.gameStart()` in `ready()`, `gp.gameplayStart()/Stop()`, `gp.ads.showFullscreen()` / `showRewardedVideo()` (GamePush pauses the game itself; `gp.on("pause"/"resume")` reach `onPause`/`onResume`), saves as JSON in the player field `save` + `gp.player.sync()`, best result in the player field `score`, purchases by product **tag** (= ids in `PRODUCTS`), language from `gp.language`.
- Player fields (`save`, `score`), leaderboards and products are created in the GamePush panel, not in code.
- Game code never touches `gp` directly — only `platform`. New GamePush features go to the `Platform` interface first.
