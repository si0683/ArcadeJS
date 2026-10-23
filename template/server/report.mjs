// The analytics report: what the game's events say about the players. Pure functions over event
// records ({ day, player, name, data, exp, version }) — tested in src/server.test.ts.
//   players   — active and new players per day
//   retention — of the players who first came on a day, how many came back 1 and 7 days later
//   levels    — the funnel: started → finished, deaths by cause, quits, average time
//   experiments — the same numbers for every A/B variant
//   errors    — the most frequent error messages

const DAY = 86_400_000
export const dayOf = (time) => new Date(time).toISOString().slice(0, 10)
const addDays = (day, n) => dayOf(Date.parse(`${day}T00:00:00Z`) + n * DAY)

/**
 * @param {{ day: string, player: string, name: string, data: Record<string, unknown>, exp?: Record<string, string>, version?: string }[]} events
 * @param {Record<string, string>} firstSeen player → the day they first came (kept by the server for all time)
 */
export function buildReport(events, firstSeen) {
  const days = [...new Set(events.map((e) => e.day))].sort()
  const seen = new Map() // player → Set of days
  for (const e of events) {
    if (!seen.has(e.player)) seen.set(e.player, new Set())
    seen.get(e.player).add(e.day)
  }

  const players = days.map((day) => {
    const active = [...seen].filter(([, set]) => set.has(day)).map(([p]) => p)
    return { day, active: active.length, new: active.filter((p) => firstSeen[p] === day).length }
  })

  const retention = days.map((day) => {
    const cohort = [...seen.keys()].filter((p) => firstSeen[p] === day)
    const back = (n) => {
      const later = addDays(day, n)
      // A day still in the future (or outside the data) has no answer yet
      if (later > days.at(-1)) return null
      return cohort.length ? cohort.filter((p) => seen.get(p).has(later)).length / cohort.length : 0
    }
    return { day, players: cohort.length, d1: back(1), d7: back(7) }
  })

  return {
    from: days[0] ?? null,
    to: days.at(-1) ?? null,
    events: events.length,
    players,
    retention,
    levels: funnel(events),
    experiments: experiments(events),
    errors: topErrors(events),
    versions: count(events.map((e) => e.version || "?")),
  }
}

/** Level funnel: who started, who finished, how they died */
export function funnel(events) {
  const levels = {}
  const get = (n) =>
    (levels[n] ??= {
      level: n,
      starts: 0,
      starters: new Set(),
      completes: 0,
      finishers: new Set(),
      seconds: 0,
      deaths: {},
      quits: 0,
      gameOvers: 0,
    })
  for (const e of events) {
    const n = Number(e.data?.level)
    if (!Number.isInteger(n) || n < 1) continue
    const l = get(n)
    if (e.name === "level_start") {
      l.starts++
      l.starters.add(e.player)
    } else if (e.name === "level_complete") {
      l.completes++
      l.finishers.add(e.player)
      l.seconds += Number(e.data.seconds) || 0
    } else if (e.name === "death") {
      const cause = String(e.data.cause ?? "?")
      l.deaths[cause] = (l.deaths[cause] ?? 0) + 1
    } else if (e.name === "quit") l.quits++
    else if (e.name === "game_over") l.gameOvers++
  }
  return Object.values(levels)
    .sort((a, b) => a.level - b.level)
    .map((l) => ({
      level: l.level,
      starts: l.starts,
      players: l.starters.size,
      finished: l.finishers.size,
      /** Share of the players who started the level and finished it */
      completion: l.starters.size ? l.finishers.size / l.starters.size : 0,
      avgSeconds: l.completes ? Math.round(l.seconds / l.completes) : null,
      deaths: l.deaths,
      quits: l.quits,
      gameOvers: l.gameOvers,
    }))
}

/** Every experiment variant: its players and how often their levels end in a win */
export function experiments(events) {
  const result = {}
  for (const e of events) {
    for (const [name, variant] of Object.entries(e.exp ?? {})) {
      const v = ((result[name] ??= {})[variant] ??= { players: new Set(), starts: 0, completes: 0 })
      v.players.add(e.player)
      if (e.name === "level_start") v.starts++
      if (e.name === "level_complete") v.completes++
    }
  }
  return Object.fromEntries(
    Object.entries(result).map(([name, variants]) => [
      name,
      Object.fromEntries(
        Object.entries(variants).map(([variant, v]) => [
          variant,
          {
            players: v.players.size,
            starts: v.starts,
            completes: v.completes,
            completion: v.starts ? v.completes / v.starts : 0,
          },
        ]),
      ),
    ]),
  )
}

function topErrors(events) {
  return Object.entries(count(events.filter((e) => e.name === "error").map((e) => String(e.data?.message ?? "?"))))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([message, times]) => ({ message, times }))
}

function count(values) {
  const result = {}
  for (const v of values) result[v] = (result[v] ?? 0) + 1
  return result
}

// ---------- the report as a page: GET /report.html ----------

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
const pct = (v) => (v === null ? "—" : `${Math.round(v * 100)}%`)
const bar = (v) => (v === null ? "" : `<i style="width:${Math.round(v * 100)}%"></i>`)

export function renderReport(r) {
  const table = (head, rows) =>
    `<table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`
  const levels = table(
    ["Уровень", "Начали (игроков)", "Прошли", "Доля", "Среднее время", "Смерти", "Вышли", "Проиграли"],
    r.levels.map((l) => [
      l.level,
      l.players,
      l.finished,
      `<span class="bar">${bar(l.completion)}</span> ${pct(l.completion)}`,
      l.avgSeconds === null ? "—" : `${l.avgSeconds} с`,
      esc(
        Object.entries(l.deaths)
          .map(([c, n]) => `${c}: ${n}`)
          .join(", ") || "—",
      ),
      l.quits,
      l.gameOvers,
    ]),
  )
  const retention = table(
    ["День", "Новые игроки", "Вернулись на 1-й день", "На 7-й день"],
    r.retention.map((d) => [d.day, d.players, pct(d.d1), pct(d.d7)]),
  )
  const players = table(
    ["День", "Играли", "Новые"],
    r.players.map((d) => [d.day, d.active, d.new]),
  )
  const exps = Object.entries(r.experiments)
    .map(
      ([name, variants]) =>
        `<h3>${esc(name)}</h3>` +
        table(
          ["Вариант", "Игроков", "Запусков уровня", "Побед", "Доля побед"],
          Object.entries(variants).map(([v, s]) => [esc(v), s.players, s.starts, s.completes, pct(s.completion)]),
        ),
    )
    .join("")
  const errors = table(
    ["Сообщение", "Раз"],
    r.errors.map((e) => [esc(e.message), e.times]),
  )
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Аналитика игры</title><style>
body{font:14px/1.5 system-ui,sans-serif;margin:24px;color:#1d1630;background:#fff}h1{margin:0 0 4px}h2{margin:28px 0 8px}
table{border-collapse:collapse;min-width:420px}th,td{padding:6px 10px;border-bottom:1px solid #e5e2f0;text-align:left}
th{color:#6b6390;font-weight:600}.bar{display:inline-block;width:80px;height:8px;background:#eee;vertical-align:middle}
.bar i{display:block;height:100%;background:#7c5cff}p{color:#6b6390}
@media(prefers-color-scheme:dark){body{background:#14101f;color:#eee}th,td{border-color:#2c2545}.bar{background:#2c2545}}
</style></head><body><h1>Аналитика игры</h1><p>${r.from ?? "нет данных"} — ${r.to ?? ""} · событий: ${r.events}</p>
<h2>Уровни: где игроки застревают</h2>${levels}<h2>Удержание</h2>${retention}<h2>Игроки по дням</h2>${players}
<h2>A/B-тесты</h2>${exps || "<p>Нет экспериментов</p>"}<h2>Ошибки</h2>${errors}</body></html>`
}
