import type { DistanceUnit, TrainingSession } from '../types'
import { computeSessionDistanceKm, computeSessionWeightKg, getSessionAverageRepTime } from '../utils/stats'
import { formatSeconds } from '../utils/time'

interface SessionListProps {
  sessions: TrainingSession[]
  loading?: boolean
  onEdit: (session: TrainingSession) => void
  onDelete: (session: TrainingSession) => void
}

function SessionList({ sessions, loading = false, onEdit, onDelete }: SessionListProps) {
  const runningSessions = sessions.filter((session) => session.type === 'running')
  const gymSessions = sessions.filter((session) => session.type === 'gym')

  const hasSessions = sessions.length > 0

  return (
    <section className="panel session-list">
      <header className="panel-header">
        <h2>Sessions for the selected day</h2>
        <p>
          Review what&apos;s scheduled, monitor logged times and loads, and jump back into edit mode
          when you need to tweak details.
        </p>
      </header>

      {loading && <p className="session-list__status">Loading sessions…</p>}

      {!loading && !hasSessions && (
        <div className="session-list__empty">
          <p>
            No sessions logged for this day yet. Use the form above to add the first training block.
          </p>
        </div>
      )}

      {runningSessions.length > 0 && (
        <SessionGroup
          label="Running sessions"
          description="Rep-based efforts, intervals, or track workouts."
          sessions={runningSessions}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}

      {gymSessions.length > 0 && (
        <SessionGroup
          label="Gym sessions"
          description="Strength and conditioning blocks with tracked load."
          sessions={gymSessions}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </section>
  )
}

interface SessionGroupProps {
  label: string
  description: string
  sessions: TrainingSession[]
  onEdit: (session: TrainingSession) => void
  onDelete: (session: TrainingSession) => void
}

function SessionGroup({ label, description, sessions, onEdit, onDelete }: SessionGroupProps) {
  return (
    <section className="session-group" aria-label={label}>
      <div className="session-group__header">
        <h3>{label}</h3>
        <p>{description}</p>
      </div>
      <div className="session-group__grid">
        {sessions.map((session) => (
          <article
            key={session.id ?? `${session.date}-${session.title}`}
            className="session-card"
          >
            <header className="session-card__header">
              <div>
                <h4>{session.title}</h4>
                {session.focusArea && <p className="session-card__focus">{session.focusArea}</p>}
              </div>
              <div className="session-card__actions">
                <button type="button" className="ghost-button" onClick={() => onEdit(session)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="ghost-button ghost-button--danger"
                  onClick={() => onDelete(session)}
                >
                  Delete
                </button>
              </div>
            </header>

            <ul className="session-card__metrics">
              {renderVolumeDetails(session)}
              {renderAverageRepTime(session)}
              {renderRecovery(session)}
              {renderDistance(session)}
              {renderWeight(session)}
              {session.customMetrics?.map((metric) => (
                <li key={metric.id} className="session-card__metric">
                  <span className="session-card__metric-label">{metric.label}</span>
                  <span className="session-card__metric-value">{metric.value}</span>
                </li>
              ))}
            </ul>

            {session.notes && (
              <p className="session-card__notes">
                <strong>Notes:</strong> {session.notes}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function renderVolumeDetails(session: TrainingSession) {
  if (!session.series && !session.repsPerSeries) {
    return null
  }

  const chunks = []
  if (session.series) {
    chunks.push(`${session.series} series`)
  }
  if (session.repsPerSeries) {
    chunks.push(`${session.repsPerSeries} reps`)
  }

  return (
    <li className="session-card__metric">
      <span className="session-card__metric-label">Volume</span>
      <span className="session-card__metric-value">{chunks.join(' × ')}</span>
    </li>
  )
}

function renderAverageRepTime(session: TrainingSession) {
  const average = getSessionAverageRepTime(session)
  if (average === null) {
    return null
  }

  return (
    <li className="session-card__metric">
      <span className="session-card__metric-label">Avg rep</span>
      <span className="session-card__metric-value">{formatSeconds(average)}</span>
    </li>
  )
}

function renderRecovery(session: TrainingSession) {
  if (session.recoveryTime === undefined || session.recoveryTime === null) {
    return null
  }

  return (
    <li className="session-card__metric">
      <span className="session-card__metric-label">Recovery</span>
      <span className="session-card__metric-value">{formatSeconds(session.recoveryTime)}</span>
    </li>
  )
}

function renderDistance(session: TrainingSession) {
  if (session.type !== 'running') {
    return null
  }

  const segments = session.distanceSegments ?? []
  const perRep = session.distancePerRep
  const unit = (session.distanceUnit ?? 'm') as DistanceUnit
  const totalDistanceKm = computeSessionDistanceKm(session)

  if (segments.length === 0 && !perRep && totalDistanceKm === 0) {
    return null
  }

  const totalLabel =
    totalDistanceKm > 0 ? `${formatDistance(totalDistanceKm, 'km')} total` : undefined
  const segmentsLabel =
    segments.length > 0
      ? formatSegmentsSummary(segments, unit, session.series)
      : undefined
  const perRepLabel =
    segments.length === 0
      ? unit === 'm'
        ? perRep
          ? `${perRep} m per rep`
          : undefined
        : perRep
          ? `${perRep} km per rep`
          : undefined
      : undefined

  return (
    <li className="session-card__metric">
      <span className="session-card__metric-label">Distance</span>
      <span className="session-card__metric-value">
        {[segmentsLabel, perRepLabel, totalLabel].filter(Boolean).join(' • ')}
      </span>
    </li>
  )
}

function formatSegmentsSummary(segments: number[], unit: DistanceUnit, series?: number | null) {
  const formattedSegments = segments
    .slice(0, 5)
    .map((segment) => formatDistanceValue(segment, unit))
    .join(' → ')

  const hasMoreSegments = segments.length > 5
  const segmentSummary = hasMoreSegments ? `${formattedSegments} …` : formattedSegments
  const seriesCount = series ?? null

  if (seriesCount && seriesCount > 1) {
    return `${segmentSummary} pattern × ${seriesCount} series`
  }

  return `${segmentSummary} pattern`
}

function renderWeight(session: TrainingSession) {
  if (session.type !== 'gym') {
    return null
  }

  const weight = session.weightPerRep
  const unit = session.weightUnit ?? 'kg'
  const totalWeightKg = computeSessionWeightKg(session)

  if (!weight && totalWeightKg === 0) {
    return null
  }

  const perRepLabel = weight ? `${weight} ${unit} per rep` : undefined
  const totalLabel =
    totalWeightKg > 0 ? `${formatWeight(totalWeightKg, unit)} total` : undefined

  return (
    <li className="session-card__metric">
      <span className="session-card__metric-label">Load</span>
      <span className="session-card__metric-value">
        {[perRepLabel, totalLabel].filter(Boolean).join(' • ')}
      </span>
    </li>
  )
}

function formatDistance(distance: number, unit: 'km'): string {
  if (unit === 'km') {
    if (distance >= 10) {
      return `${distance.toFixed(1)} km`
    }
    return `${distance.toFixed(2)} km`
  }
  return `${distance} ${unit}`
}

function formatDistanceValue(distance: number, unit: DistanceUnit): string {
  if (unit === 'km') {
    return distance >= 10 ? `${distance.toFixed(1)} km` : `${distance.toFixed(2)} km`
  }

  if (Number.isInteger(distance)) {
    return `${distance.toFixed(0)} m`
  }

  return `${distance.toFixed(1)} m`
}

function formatWeight(totalWeightKg: number, preferredUnit: string): string {
  if (preferredUnit === 'lb') {
    const pounds = totalWeightKg / 0.453592
    return pounds >= 100 ? `${pounds.toFixed(0)} lb` : `${pounds.toFixed(1)} lb`
  }

  return totalWeightKg >= 100 ? `${totalWeightKg.toFixed(0)} kg` : `${totalWeightKg.toFixed(1)} kg`
}

export default SessionList
