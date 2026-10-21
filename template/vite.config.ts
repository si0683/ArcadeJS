import { defineConfig } from "vite"

export default defineConfig({
  // Relative paths: the built game works from any folder, including GitHub Pages /<repo>/
  base: "./",
  server: { port: 5173 },
  // Phaser alone is ~1.5 MB; it is fine for a game
  build: { chunkSizeWarningLimit: 2000 },
})
