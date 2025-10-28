const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function toISODateString(date: Date): string {
  const normalized = startOfDay(date)
  const tzOffset = normalized.getTimezoneOffset()
  const adjusted = new Date(normalized.getTime() - tzOffset * 60_000)
  return adjusted.toISOString().slice(0, 10)
}

export function fromISODateString(value: string): Date {
  if (!value) {
    return startOfDay(new Date())
  }
  const [year, month, day] = value.split('-').map(Number)
  return startOfDay(new Date(year, (month ?? 1) - 1, day ?? 1))
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return startOfDay(next)
}

export function formatLongDate(date: Date): string {
  return DATE_FORMATTER.format(date)
}

export function formatShortDate(date: Date): string {
  return SHORT_DATE_FORMATTER.format(date)
}

export function startOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}
