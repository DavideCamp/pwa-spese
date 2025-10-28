export function parseDurationToSeconds(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (!Number.isNaN(Number(trimmed))) {
    const seconds = Number(trimmed)
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
  }

  const segments = trimmed.split(':').map((segment) => segment.trim())
  if (segments.some((segment) => segment === '' || Number.isNaN(Number(segment)))) {
    return null
  }

  const numbers = segments.map(Number)
  if (numbers.length === 2) {
    const [minutes, seconds] = numbers
    return minutes * 60 + seconds
  }

  if (numbers.length === 3) {
    const [hours, minutes, seconds] = numbers
    return hours * 3600 + minutes * 60 + seconds
  }

  return null
}

export function formatSeconds(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  const totalTenths = Math.max(0, Math.round(value * 10))
  const totalSeconds = Math.floor(totalTenths / 10)
  const tenths = totalTenths % 10
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const secondsBase = seconds.toString().padStart(2, '0')
  const secondsWithTenths = `${secondsBase}.${tenths}`

  if (hours > 0) {
    const minutesPart = minutes.toString().padStart(2, '0')
    return `${hours}:${minutesPart}:${secondsWithTenths}`
  }

  return `${minutes}:${secondsWithTenths}`
}
