/// <reference types="vite/client" />

// Settings from .env (copy .env.example). Only VITE_* reach the game, and they end up in the public
// build — never put a secret here (server keys belong in server/.env).
interface ImportMetaEnv {
  /** Sentry or GlitchTip project DSN: error reports (src/telemetry.ts → sentrySink) */
  readonly VITE_SENTRY_DSN?: string
  /** Yandex Metrica counter number: events as goals */
  readonly VITE_METRICA_ID?: string
  /** The game server (server/): analytics, leaderboard, cloud save. Example: https://api.example.com */
  readonly VITE_BACKEND_URL?: string
}

/** package.json "version" + the git commit, set by vite.config.ts: shown in the menu, sent with error reports */
declare const __APP_VERSION__: string
