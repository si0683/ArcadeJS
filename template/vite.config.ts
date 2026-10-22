import { defineConfig } from "vite"

export default defineConfig({
  // Relative paths: the built game works from any folder, including GitHub Pages /<repo>/
  base: "./",
  // No SPA fallback: missing files answer 404 (e.g. /sdk.js of a game portal under npm run dev)
  appType: "mpa",
  server: { port: 5173 },
  // Phaser alone is ~1.5 MB; it is fine for a game
  build: { chunkSizeWarningLimit: 2000 },
})
