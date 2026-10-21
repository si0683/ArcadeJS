# Changelog

All versions stay available on the CDN: `https://cdn.jsdelivr.net/gh/si0683/ArcadeJS@<version>/arcade.js`.

## 2.0.0

General-purpose release for any developer (1.x was built for classroom use).

- **i18n:** `lang: 'en' | 'ru'` (defaults to the browser language) and `texts: { ... }` to override any interface string. English is the default for non-Russian browsers.
- **Quiz is now an optional module:** `quiz: { questions: [{ text, answer, wrong }] }` for your own questions; math works in every language; the Russian school sets (`rus`, `eng`, `hist`) are offered only with `lang: 'ru'`.
- **npm package** `arcadejs` with an ES module entry (`arcade.mjs`), TypeScript types (`arcade.d.ts`) and `exports` map. Importing on the server (SSR) is safe and does nothing.
- **`assetsUrl`** — serve sounds and sprites from your own host instead of the CDN.
- `game.lang`, `game.texts`, `Arcade.languages`.
- English code comments, English examples (`CONFIG` object instead of `LAB`), MIT `LICENSE`, `THIRD_PARTY.md`.
- Breaking: default `title` is localized; world names and difficulty labels come from `texts`; `Arcade.subjects` is a plain array of ids.

## 1.1.0

ZzFX synth with 20 presets, 67 Kenney sounds (loaded on demand), 5 CC0 music tracks, 201 Kenney sprites with auto-animated characters, Twemoji emoji images.

## 1.0.0

Core engine: objects, collisions, platforms, camera, input, screens, HUD, particles, timers, quiz and upgrade picker, Matter.js physics and Three.js 3D add-ons.
