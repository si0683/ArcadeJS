// Plural forms by the language's own rules (Intl.PluralRules): "1 монета, 2 монеты, 5 монет", "1 coin, 2 coins".
// In a text: {m:монета|монеты|монет} — forms in the order zero, one, two, few, many, other, keeping only
// the categories the language has (Russian: one, few, many; English: one, other).

const ORDER: Intl.LDMLPluralRule[] = ["zero", "one", "two", "few", "many", "other"]

/** Categories of a language in the order the forms are written */
export function pluralCategories(lang: string): Intl.LDMLPluralRule[] {
  const used = new Intl.PluralRules(lang).resolvedOptions().pluralCategories
  return ORDER.filter((c) => used.includes(c))
}

/** Forms a text must give: every category except "other" (Russian 3, English 1 — 2 is normal there) */
export function minPluralForms(lang: string): number {
  return Math.max(1, pluralCategories(lang).filter((c) => c !== "other").length)
}

/** The form for a number: pluralForm("ru", 3, ["монета", "монеты", "монет"]) → "монеты" */
export function pluralForm(lang: string, n: number, forms: string[]): string {
  const index = pluralCategories(lang).indexOf(new Intl.PluralRules(lang).select(n))
  return forms[Math.min(Math.max(0, index), forms.length - 1)] ?? ""
}

/** Fills {name} and {name:form|form|…} in a text */
export function format(lang: string, text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)(?::([^}]*))?\}/g, (_, name: string, forms?: string) => {
    const value = values[name] ?? ""
    return forms === undefined ? String(value) : pluralForm(lang, Number(value), forms.split("|"))
  })
}
