
## Yandex Games SDK

This project was created with `--sdk=yandex`. Details and the moderation checklist: `YANDEX.md`.

- Game code never calls `ysdk` / `YaGames` directly — only `platform` from `src/platform` (implementation: `src/platform/yandex.ts`; docs https://yandex.ru/dev/games/doc/ru/sdk/sdk-about). Add new SDK features (purchases, sticky banner, `getStats`…) to the `Platform` interface in `types.ts`, implement them in both `yandex.ts` and `none.ts`, then call them from the game.
- Calls already wired: `platform.init()` before the game, `ready()` after loading (LoadingAPI), `gameplayStart()` / `gameplayStop()` around actual play (GameplayAPI), `showFullscreenAd()` only at logical pauses (between rounds, never during play), `onPause`/`onResume` mute and freeze the game (ads, hidden tab), `saveData()` right after progress changes (limit 100 calls per 5 min), `submitScore()` at round end (limit 1 per second, leaderboard `score`).
- The SDK script is `/sdk.js` (relative path, required for console uploads); it does not exist under `npm run dev`, so the platform falls back to no-SDK behaviour. Test with the SDK: `npm run yandex` (sdk-dev-proxy, dev environment).
- Player language comes from the SDK (`platform.lang`) — keep all player texts in `src/i18n.ts`.
- No links to external sites, no ads outside the SDK, no page scrolling or text selection.
- Release: `npm run zip` → `game.zip` (index.html at the root) → Yandex Games console.
