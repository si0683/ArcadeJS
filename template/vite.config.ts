/// <reference types="vitest/config" />
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { relative } from "node:path"

import { defineConfig, type Plugin } from "vite"

import { validateContent } from "./content/validate.ts"

/**
 * Game content check (content/validate.ts): a wrong number in content/*.json, a missing translation
 * or a broken level map stops `npm run build`, and under `npm run dev` the browser shows what to fix
 * instead of a half-working game.
 */
function contentCheck(): Plugin {
  const fail = (problems: string[]) => `Game content has ${problems.length} problem(s):\n  ${problems.join("\n  ")}`
  return {
    name: "content-check",
    enforce: "pre",
    // Every content/*.json the game imports is checked when it loads (and reloads after an edit)
    transform(_code, id) {
      if (!/[\\/]content[\\/].*\.json$/.test(id)) return
      const problems = validateContent(process.cwd())
      if (problems.length > 0) this.error(fail(problems))
    },
    // Tiled maps are not imported: an edited map reloads the game, so the check runs again
    configureServer(server) {
      server.watcher.on("change", (file) => {
        if (!relative(process.cwd(), file).replaceAll("\\", "/").startsWith("public/assets/maps/")) return
        server.moduleGraph.invalidateAll()
        server.ws.send({ type: "full-reload" })
      })
    },
  }
}

/** "1.2.0+3f2a9c1": package.json version and the git commit — the menu shows it, error reports carry it */
function appVersion(): string {
  const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string }
  try {
    const commit = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
    return commit ? `${version}+${commit}` : version
  } catch {
    return version
  }
}

export default defineConfig({
  // Relative paths: the built game works from any folder, including GitHub Pages /<repo>/
  base: "./",
  // No SPA fallback: missing files answer 404 (e.g. /sdk.js of a game portal under npm run dev)
  appType: "mpa",
  server: { port: 5173 },
  plugins: [contentCheck()],
  // Pre-bundled at server start: Tweakpane is imported only by the dev tools (dynamic import), and found
  // late it makes Vite reload the page on the first run of a fresh project — mid-game or mid-test
  optimizeDeps: { include: ["phaser", "tweakpane"] },
  define: { __APP_VERSION__: JSON.stringify(appVersion()) },
  build: {
    // Phaser alone is ~1.5 MB; it is fine for a game
    chunkSizeWarningLimit: 2000,
    // Source maps only for Sentry (npm run sentry:sourcemaps uploads and removes them): players never get them
    sourcemap: process.env.SOURCEMAP ? "hidden" : false,
  },
  // Unit tests (npm test): game rules, saves, platform — files next to the code, *.test.ts
  test: { include: ["src/**/*.test.ts", "server/**/*.test.mjs", "scripts/**/*.test.mjs"] },
})
