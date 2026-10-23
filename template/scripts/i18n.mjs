// Texts as a table for translators: Google Sheets, Excel, LibreOffice.
//   npm run i18n:export            content/i18n/*.json → content/i18n.csv (columns: key, ru, en, …)
//   npm run i18n:import            content/i18n.csv → content/i18n/*.json
//   npm run i18n:import -- <file or link>
// A Google Sheet: File → Share → Publish to web → CSV, and pass that link; the table stays the source,
// the game takes its texts with one command. New languages are new columns (then add the language
// to LANGUAGES in src/i18n.ts). `npm run check` validates the result (placeholders, plural forms, lengths).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const DIR = "content/i18n"
const CSV = "content/i18n.csv"
const BASE = "ru"

const [command, source = CSV] = process.argv.slice(2)

if (command === "export") exportTable()
else if (command === "import") await importTable(source)
else {
  console.error("Usage: node scripts/i18n.mjs export | import [file or URL]")
  process.exit(1)
}

function languages() {
  const list = readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
  // The base language is the first column after the key
  return [BASE, ...list.filter((l) => l !== BASE).sort()]
}

function exportTable() {
  const langs = languages()
  const sets = Object.fromEntries(langs.map((l) => [l, JSON.parse(readFileSync(join(DIR, `${l}.json`), "utf8"))]))
  const rows = [["key", ...langs]]
  for (const key of Object.keys(sets[BASE])) rows.push([key, ...langs.map((l) => sets[l][key] ?? "")])
  // BOM: Excel opens UTF-8 with Cyrillic correctly only with it
  writeFileSync(CSV, "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n")
  console.log(`${CSV}: ${rows.length - 1} texts × ${langs.length} languages (${langs.join(", ")})`)
}

async function importTable(from) {
  const text = /^https?:\/\//.test(from)
    ? await fetch(from).then((r) => {
        if (!r.ok) throw new Error(`${from}: HTTP ${r.status}`)
        return r.text()
      })
    : readFileSync(from, "utf8")
  const [header, ...rows] = parseCsv(text.replace(/^\uFEFF/, "")).filter((row) => row.some((c) => c.trim() !== ""))
  if (!header || header[0].trim() !== "key") throw new Error(`${from}: the first column must be "key"`)
  const langs = header.slice(1).map((l) => l.trim())
  for (const [i, lang] of langs.entries()) {
    if (!lang) continue
    const set = {}
    for (const row of rows) {
      const key = row[0]?.trim()
      // Empty cells stay out: the check reports the missing text instead of shipping a blank
      if (key && row[i + 1]?.trim()) set[key] = row[i + 1]
    }
    const file = join(DIR, `${lang}.json`)
    const isNew = !existsSync(file)
    writeFileSync(file, JSON.stringify(set, null, 2) + "\n")
    console.log(`${file}: ${Object.keys(set).length} texts${isNew ? " (new language: add it to src/i18n.ts)" : ""}`)
  }
}

/** One CSV cell: quoted when it has a comma, a quote or a line break */
function cell(value) {
  const s = String(value)
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

/** CSV (RFC 4180, comma or semicolon — Excel in Russian locale saves with ";") → rows of cells */
function parseCsv(text) {
  const firstLine = text.slice(0, text.indexOf("\n") >>> 0)
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ","
  const rows = []
  let row = []
  let value = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        value += '"'
        i++
      } else if (c === '"') quoted = false
      else value += c
    } else if (c === '"') quoted = true
    else if (c === sep) {
      row.push(value)
      value = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(value)
      rows.push(row)
      row = []
      value = ""
    } else value += c
  }
  if (value !== "" || row.length > 0) rows.push([...row, value])
  return rows
}
