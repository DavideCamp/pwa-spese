import type { ChangeEvent } from 'react'
import { addDays, formatLongDate, fromISODateString, toISODateString } from '../utils/dates'
import type { TrainingSession, TrainingStats } from '../types'
import { formatSeconds } from '../utils/time'
import { computeSessionDistanceKm, computeSessionWeightKg } from '../utils/stats'

interface DayNavigatorProps {
  date: Date
  onChange: (date: Date) => void
  sessions: TrainingSession[]
  stats: TrainingStats
}

function DayNavigator({ date, onChange, sessions, stats }: DayNavigatorProps) {
  const handlePrevious = () => onChange(addDays(date, -1))
  const handleNext = () => onChange(addDays(date, 1))

  const handleDateInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const isoDate = event.currentTarget.value
    onChange(fromISODateString(isoDate))
  }

  const runningSessions = sessions.filter((session) => session.type === 'running')
  const gymSessions = sessions.filter((session) => session.type === 'gym')
  const totalSessions = sessions.length

  const fastestRep = getExtremeRepTime(sessions, 'min')
  const slowestRep = getExtremeRepTime(sessions, 'max')

  const longestRun =
    runningSessions.length > 0
      ? Math.max(...runningSessions.map(computeSessionDistanceKm))
      : 0
  const heaviestLoad =
    gymSessions.length > 0
      ? Math.max(...gymSessions.map(computeSessionWeightKg))
      : 0

  return (
    <section className="panel day-navigator" aria-label="Select training day">
      <div className="day-navigator__controls">
        <button type="button" onClick={handlePrevious} className="ghost-button">
          <span aria-hidden="true">←</span>
          <span className="button-label">Previous</span>
        </button>
        <div className="day-navigator__date" role="status" aria-live="polite">
          <strong>{formatLongDate(date)}</strong>
          <span className="day-navigator__date-short">{toISODateString(date)}</span>
        </div>
        <button type="button" onClick={handleNext} className="ghost-button">
          <span className="button-label">Next</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <dl className="day-navigator__summary">
        <SummaryItem
          label="Sessions"
          value={`${totalSessions} total`}
          hint={describeSessionMix(runningSessions.length, gymSessions.length)}
        />
        <SummaryItem
          label="Avg rep"
          value={
            stats.averageRepTimeSeconds === null
              ? '—'
              : formatSeconds(stats.averageRepTimeSeconds)
          }
          hint={
            fastestRep && slowestRep
              ? `Best ${formatSeconds(fastestRep)} • Slowest ${formatSeconds(slowestRep)}`
              : fastestRep
                ? `Fastest ${formatSeconds(fastestRep)}`
                : 'No reps yet'
          }
        />
        <SummaryItem
          label="Distance"
          value={
            stats.totalDistanceKm > 0
              ? `${formatDistance(stats.totalDistanceKm)}`
              : '0 km'
          }
          hint={
            longestRun > 0
              ? `Longest block ${formatDistance(longestRun)}`
              : runningSessions.length > 0
                ? 'No distance logged'
                : 'No running sessions'
          }
        />
        <SummaryItem
          label="Gym load"
          value={
            stats.totalWeightKg > 0
              ? `${formatWeight(stats.totalWeightKg)}`
              : '0 kg'
          }
          hint={
            heaviestLoad > 0
              ? `Heaviest block ${formatWeight(heaviestLoad)}`
              : gymSessions.length > 0
                ? 'No load logged'
                : 'No gym sessions'
          }
        />
      </dl>

      <label className="day-navigator__picker">
        <span>Select a date</span>
        <input
          type="date"
          value={toISODateString(date)}
          onChange={handleDateInputChange}
          aria-label="Choose a date to review training sessions"
        />
      </label>
    </section>
  )
}

export default DayNavigator

interface SummaryItemProps {
  label: string
  value: string
  hint?: string
}

function SummaryItem({ label, value, hint }: SummaryItemProps) {
  return (
    <div className="day-navigator__summary-item">
      <dt className="day-navigator__summary-label">{label}</dt>
      <dd className="day-navigator__summary-value">
        <span className="day-navigator__summary-main">{value}</span>
        {hint && <span className="day-navigator__summary-hint">{hint}</span>}
      </dd>
    </div>
  )
}

function describeSessionMix(runningCount: number, gymCount: number) {
  if (runningCount === 0 && gymCount === 0) {
    return 'No sessions yet'
  }
  if (runningCount > 0 && gymCount > 0) {
    return `${runningCount} running • ${gymCount} gym`
  }
  if (runningCount > 0) {
    return `${runningCount} running`
  }
  return `${gymCount} gym`
}

function getExtremeRepTime(
  sessions: TrainingSession[],
  mode: 'min' | 'max',
): number | null {
  const repTimes = sessions.flatMap((session) => session.repTimes ?? [])
  const validRepTimes = repTimes.filter((value) => Number.isFinite(value) && value >= 0)
  if (validRepTimes.length === 0) {
    return null
  }
  return mode === 'min'
    ? Math.min(...validRepTimes)
    : Math.max(...validRepTimes)
}

function formatDistance(valueKm: number): string {
  if (valueKm >= 10) {
    return `${valueKm.toFixed(1)} km`
  }
  return `${valueKm.toFixed(2)} km`
}

function formatWeight(valueKg: number): string {
  if (valueKg >= 100) {
    return `${valueKg.toFixed(0)} kg`
  }
  return `${valueKg.toFixed(1)} kg`
}
