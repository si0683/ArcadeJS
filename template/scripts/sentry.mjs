// Source maps for Sentry: errors from players show the line in src/, not in the minified bundle.
//   npm run sentry:sourcemaps
// Builds with hidden source maps, marks the files with debug ids (sentry-cli sourcemaps inject),
// uploads the maps to your Sentry project and deletes them from dist/ — players never download them.
// Needs (in the environment or .env.sentry.local, never in .env — that one is public):
//   SENTRY_AUTH_TOKEN  — sentry.io → Settings → Auth Tokens (scope project:releases)
//   SENTRY_ORG, SENTRY_PROJECT — the slugs from the project address
//   SENTRY_URL         — only for self-hosted Sentry / GlitchTip
// Then publish this dist/ (npm run zip / build:web). The game must have VITE_SENTRY_DSN in .env.
import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync } from "node:fs"
import { join } from "node:path"

const LOCAL = ".env.sentry.local"
if (existsSync(LOCAL)) {
  for (const line of readFileSync(LOCAL, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}
for (const name of ["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"]) {
  if (!process.env[name]) {
    console.error(`${name} is not set (environment or ${LOCAL})`)
    process.exit(1)
  }
}

const run = (command, args, env = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run("npx", ["tsc"])
run("npx", ["vite", "build"], { SOURCEMAP: "1" })
run("npx", ["--yes", "@sentry/cli@2", "sourcemaps", "inject", "dist"])
run("npx", ["--yes", "@sentry/cli@2", "sourcemaps", "upload", "dist"])

let removed = 0
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith(".map")) {
      unlinkSync(path)
      removed++
    }
  }
}
walk("dist")
console.log(`Source maps uploaded; ${removed} .map files removed from dist/. Publish dist/ now.`)
