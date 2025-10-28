import type { ReactNode } from 'react'
import type { TrainingSession, TrainingStats } from '../types'
import { formatLongDate, formatShortDate } from '../utils/dates'
import { computeSessionDistanceKm, computeSessionWeightKg } from '../utils/stats'
import { formatSeconds } from '../utils/time'

interface StatsPanelProps {
  date: Date
  sessions: TrainingSession[]
  stats: TrainingStats
}

const distanceFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const weightFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function StatsPanel({ date, sessions, stats }: StatsPanelProps) {
  const runningSessions = sessions.filter((session) => session.type === 'running')
  const gymSessions = sessions.filter((session) => session.type === 'gym')

  const repTimes = sessions.flatMap((session) => session.repTimes ?? [])
  const validRepTimes = repTimes.filter((value) => Number.isFinite(value) && value >= 0)
  const fastestRep = validRepTimes.length > 0 ? Math.min(...validRepTimes) : null
  const slowestRep = validRepTimes.length > 0 ? Math.max(...validRepTimes) : null

  const longestRunKm =
    runningSessions.length > 0
      ? Math.max(...runningSessions.map((session) => computeSessionDistanceKm(session)))
      : 0

  const heaviestLoadKg =
    gymSessions.length > 0
      ? Math.max(...gymSessions.map((session) => computeSessionWeightKg(session)))
      : 0

  return (
    <section className="panel stats-panel" aria-label="Key statistics for the selected day">
      <header className="panel-header">
        <h2>Day overview</h2>
        <p>
          {formatShortDate(date)} • {runningSessions.length + gymSessions.length} session
          {runningSessions.length + gymSessions.length === 1 ? '' : 's'} scheduled.
        </p>
      </header>

      <dl className="stats-panel__grid">
        <StatItem label="Average rep time">
          {stats.averageRepTimeSeconds === null
            ? 'No rep times yet'
            : formatSeconds(stats.averageRepTimeSeconds)}
        </StatItem>

        <StatItem label="Fastest rep">
          {fastestRep === null ? '—' : formatSeconds(fastestRep)}
        </StatItem>

        <StatItem label="Slowest rep">
          {slowestRep === null ? '—' : formatSeconds(slowestRep)}
        </StatItem>

        <StatItem label="Kilometers logged">
          {stats.totalDistanceKm > 0
            ? `${distanceFormatter.format(stats.totalDistanceKm)} km`
            : '0 km'}
        </StatItem>

        <StatItem label="Longest running block">
          {longestRunKm > 0 ? `${distanceFormatter.format(longestRunKm)} km` : '—'}
        </StatItem>

        <StatItem label="Gym load (kg)">
          {stats.totalWeightKg > 0
            ? `${weightFormatter.format(stats.totalWeightKg)} kg`
            : '0 kg'}
        </StatItem>

        <StatItem label="Heaviest gym block">
          {heaviestLoadKg > 0 ? `${weightFormatter.format(heaviestLoadKg)} kg` : '—'}
        </StatItem>

        <StatItem label="Session mix">
          {describeSessionMix(runningSessions.length, gymSessions.length)}
        </StatItem>
      </dl>

      <footer className="stats-panel__footer">
        <p>{formatLongDate(date)}</p>
        <p className="stats-panel__caption">
          Stats update automatically whenever you log or adjust a session. Values persist offline
          so you can review past training days without a connection.
        </p>
      </footer>
    </section>
  )
}

interface StatItemProps {
  label: string
  children: ReactNode
}

function StatItem({ label, children }: StatItemProps) {
  return (
    <div className="stat-item">
      <dt className="stat-item__label">{label}</dt>
      <dd className="stat-item__value">{children}</dd>
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

export default StatsPanel
