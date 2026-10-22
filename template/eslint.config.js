import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import prettier from "eslint-config-prettier"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  globalIgnores(["dist", "playwright-report", "test-results"]),
  {
    files: ["**/*.{ts,js,mjs}"],
    extends: [js.configs.recommended, tseslint.configs.recommended, prettier],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // `_name` marks a parameter that has to stay (Phaser callbacks, overlaps)
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
])
