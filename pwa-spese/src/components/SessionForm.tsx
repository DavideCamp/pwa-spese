import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type {
  CustomMetric,
  DistanceUnit,
  TrainingSession,
  TrainingType,
  WeightUnit,
} from '../types'
import { fromISODateString, toISODateString } from '../utils/dates'
import { formatSeconds, parseDurationToSeconds } from '../utils/time'

interface SessionFormProps {
  selectedDate: Date
  onSave: (session: TrainingSession) => Promise<void> | void
  initialSession?: TrainingSession | null
  onCancelEdit?: () => void
}

interface FormState {
  id?: number
  date: string
  type: TrainingType
  title: string
  focusArea: string
  series: string
  repsPerSeries: string
  repTimesInput: string
  recoveryTimeInput: string
  distancePerRep: string
  distanceUnit: DistanceUnit
  distanceSegmentsInput: string
  weightPerRep: string
  weightUnit: WeightUnit
  notes: string
  customMetrics: CustomMetric[]
  createdAt?: string
  updatedAt?: string
}

const DEFAULT_DISTANCE_UNIT: DistanceUnit = 'm'
const DEFAULT_WEIGHT_UNIT: WeightUnit = 'kg'

function SessionForm({ selectedDate, onSave, initialSession, onCancelEdit }: SessionFormProps) {
  const [formState, setFormState] = useState<FormState>(() =>
    createEmptyFormState(selectedDate, 'running'),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const isEditing = Boolean(initialSession)
  const isRunning = formState.type === 'running'

  useEffect(() => {
    if (initialSession) {
      setFormState(createFormStateFromSession(initialSession))
    } else {
      setFormState((previous) => ({
        ...previous,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        date: toISODateString(selectedDate),
      }))
    }
  }, [initialSession, selectedDate])

  const titleLabel = useMemo(
    () => (isEditing ? 'Update training session' : 'Log a new training session'),
    [isEditing],
  )

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.currentTarget
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value as TrainingType
    setFormState((previous) => ({
      ...previous,
      type: value,
    }))
  }

  const handleDistanceUnitChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value as DistanceUnit
    setFormState((previous) => ({
      ...previous,
      distanceUnit: value,
    }))
  }

  const handleWeightUnitChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value as WeightUnit
    setFormState((previous) => ({
      ...previous,
      weightUnit: value,
    }))
  }

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget
    setFormState((previous) => ({
      ...previous,
      date: value,
    }))
  }

  const handleAddMetric = () => {
    setFormState((previous) => ({
      ...previous,
      customMetrics: [
        ...previous.customMetrics,
        {
          id: createMetricId(),
          label: '',
          value: '',
        },
      ],
    }))
  }

  const handleMetricChange = (
    id: string,
    key: 'label' | 'value',
    value: string,
  ) => {
    setFormState((previous) => ({
      ...previous,
      customMetrics: previous.customMetrics.map((metric) =>
        metric.id === id ? { ...metric, [key]: value } : metric,
      ),
    }))
  }

  const handleRemoveMetric = (id: string) => {
    setFormState((previous) => ({
      ...previous,
      customMetrics: previous.customMetrics.filter((metric) => metric.id !== id),
    }))
  }

  const resetForm = () => {
    setFormState(createEmptyFormState(fromISODateString(formState.date), formState.type))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)

    const title = formState.title.trim()
    if (!title) {
      setErrorMessage('Please add a short title to identify the training session.')
      return
    }

    const parsedSeries = parsePositiveNumber(formState.series)
    const parsedRepsPerSeries = parsePositiveNumber(formState.repsPerSeries)

    const repTimesResult = parseRepTimes(formState.repTimesInput)
    if (repTimesResult.invalidSamples.length > 0) {
      setErrorMessage(
        `Please double-check the rep times. Unable to read: ${repTimesResult.invalidSamples.join(', ')}`,
      )
      return
    }

    const parsedRecovery = parseDurationToSeconds(formState.recoveryTimeInput)
    const parsedDistance = parsePositiveNumber(formState.distancePerRep, true)
    const parsedWeight = parsePositiveNumber(formState.weightPerRep, true)
    const distanceSegmentsResult = parseDistanceSegments(formState.distanceSegmentsInput)
    if (distanceSegmentsResult.invalidSamples.length > 0) {
      setErrorMessage(
        `Please review the rep distance pattern. Invalid values: ${distanceSegmentsResult.invalidSamples.join(', ')}`,
      )
      return
    }

    const normalizedDistanceSegments = distanceSegmentsResult.values
    const effectiveRepsPerSeries =
      parsedRepsPerSeries ??
      (normalizedDistanceSegments.length > 0 ? normalizedDistanceSegments.length : null)

    const cleanMetrics = formState.customMetrics
      .map((metric) => ({
        ...metric,
        label: metric.label.trim(),
        value: metric.value.trim(),
      }))
      .filter((metric) => metric.label && metric.value)

    const payload: TrainingSession = {
      id: formState.id,
      createdAt: formState.createdAt,
      updatedAt: formState.updatedAt,
      date: formState.date,
      type: formState.type,
      title,
      focusArea: formState.focusArea.trim() || undefined,
      series: parsedSeries,
      repsPerSeries: effectiveRepsPerSeries,
      repTimes: repTimesResult.values,
      recoveryTime: parsedRecovery,
      distanceSegments:
        isRunning && normalizedDistanceSegments.length > 0 ? normalizedDistanceSegments : undefined,
      distancePerRep:
        isRunning && normalizedDistanceSegments.length === 0 ? parsedDistance : undefined,
      distanceUnit: isRunning ? formState.distanceUnit : undefined,
      weightPerRep: !isRunning ? parsedWeight : undefined,
      weightUnit: !isRunning ? formState.weightUnit : undefined,
      customMetrics: cleanMetrics.length > 0 ? cleanMetrics : undefined,
      notes: formState.notes.trim() || undefined,
    }

    try {
      setIsSubmitting(true)
      await onSave(payload)
      if (repTimesResult.values.length === 0 && formState.repTimesInput.trim()) {
        setInfoMessage(
          'Session saved, but rep times were skipped because no valid values were provided.',
        )
      }
      if (!isEditing) {
        resetForm()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="panel session-form">
      <header className="panel-header">
        <h2>{titleLabel}</h2>
        <p>
          Capture the structure of today&apos;s training. Fields adjust automatically for running or
          gym sessions.
        </p>
      </header>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label htmlFor="session-title">Session title</label>
          <input
            id="session-title"
            name="title"
            type="text"
            value={formState.title}
            onChange={handleInputChange}
            placeholder="e.g. Speed endurance 200s"
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="session-date">Date</label>
          <input
            id="session-date"
            type="date"
            value={formState.date}
            onChange={handleDateChange}
          />
        </div>

        <div className="form-row">
          <label htmlFor="session-type">Training type</label>
          <select id="session-type" value={formState.type} onChange={handleTypeChange}>
            <option value="running">Running</option>
            <option value="gym">Gym</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="session-focus">Focus area</label>
          <input
            id="session-focus"
            name="focusArea"
            type="text"
            value={formState.focusArea}
            onChange={handleInputChange}
            placeholder="e.g. Starts, acceleration"
          />
        </div>

        <div className="form-row">
          <label htmlFor="session-series">Number of series</label>
          <input
            id="session-series"
            name="series"
            type="number"
            min={1}
            inputMode="numeric"
            value={formState.series}
            onChange={handleInputChange}
            placeholder="e.g. 2"
          />
        </div>

        <div className="form-row">
          <label htmlFor="session-reps">Reps per series</label>
          <input
            id="session-reps"
            name="repsPerSeries"
            type="number"
            min={1}
            inputMode="numeric"
            value={formState.repsPerSeries}
            onChange={handleInputChange}
            placeholder="e.g. 8"
          />
        </div>

        <div className="form-row form-row--full">
          <label htmlFor="session-rep-times">
            Rep times
            <span className="helper-text">
              Add one value per rep (seconds or mm:ss). Separate using commas or new lines.
            </span>
          </label>
          <textarea
            id="session-rep-times"
            name="repTimesInput"
            rows={3}
            value={formState.repTimesInput}
            onChange={handleInputChange}
            placeholder="29s, 30s, 31s"
          />
        </div>

        <div className="form-row">
          <label htmlFor="session-recovery">
            Recovery between reps
            <span className="helper-text">Seconds or mm:ss</span>
          </label>
          <input
            id="session-recovery"
            name="recoveryTimeInput"
            type="text"
            inputMode="decimal"
            value={formState.recoveryTimeInput}
            onChange={handleInputChange}
            placeholder="2:00"
          />
        </div>

        {isRunning ? (
          <>
            <div className="form-row">
              <label htmlFor="session-distance">
                Distance per rep
                <span className="helper-text">Accepts decimals</span>
              </label>
              <input
                id="session-distance"
                name="distancePerRep"
                type="number"
                step="any"
                min={0}
                inputMode="decimal"
                value={formState.distancePerRep}
                onChange={handleInputChange}
                placeholder="200"
              />
            </div>
            <div className="form-row">
              <label htmlFor="session-distance-unit">Distance unit</label>
              <select
                id="session-distance-unit"
                value={formState.distanceUnit}
                onChange={handleDistanceUnitChange}
              >
                <option value="m">Meters</option>
                <option value="km">Kilometers</option>
              </select>
            </div>
            <div className="form-row form-row--full">
              <label htmlFor="session-distance-pattern">
                Rep distance pattern
                <span className="helper-text">
                  When reps have different distances, list them separated by commas or new lines.
                </span>
              </label>
              <textarea
                id="session-distance-pattern"
                name="distanceSegmentsInput"
                rows={2}
                value={formState.distanceSegmentsInput}
                onChange={handleInputChange}
                placeholder="600, 400, 300"
              />
            </div>
          </>
        ) : (
          <>
            <div className="form-row">
              <label htmlFor="session-weight">
                Weight per rep
                <span className="helper-text">Optional, accepts decimals</span>
              </label>
              <input
                id="session-weight"
                name="weightPerRep"
                type="number"
                step="any"
                min={0}
                inputMode="decimal"
                value={formState.weightPerRep}
                onChange={handleInputChange}
                placeholder="80"
              />
            </div>
            <div className="form-row">
              <label htmlFor="session-weight-unit">Weight unit</label>
              <select
                id="session-weight-unit"
                value={formState.weightUnit}
                onChange={handleWeightUnitChange}
              >
                <option value="kg">Kilograms</option>
                <option value="lb">Pounds</option>
              </select>
            </div>
          </>
        )}

        <div className="form-row form-row--full">
          <label htmlFor="session-notes">Notes</label>
          <textarea
            id="session-notes"
            name="notes"
            rows={3}
            value={formState.notes}
            onChange={handleInputChange}
            placeholder="Drills, cues, or athlete feedback"
          />
        </div>

        {(!isRunning || formState.customMetrics.length > 0) && (
          <div className="form-row form-row--full">
            <div className="form-row__header">
              <label>Custom metrics</label>
              <span className="helper-text">
                Track additional variables (e.g. RPE, equipment, tempo)
              </span>
            </div>
            <div className="custom-metrics">
              {formState.customMetrics.map((metric) => (
                <div className="custom-metrics__row" key={metric.id}>
                  <input
                    type="text"
                    value={metric.label}
                    onChange={(event) =>
                      handleMetricChange(metric.id, 'label', event.currentTarget.value)
                    }
                    placeholder="Label"
                    aria-label="Metric label"
                  />
                  <input
                    type="text"
                    value={metric.value}
                    onChange={(event) =>
                      handleMetricChange(metric.id, 'value', event.currentTarget.value)
                    }
                    placeholder="Value"
                    aria-label="Metric value"
                  />
                  <button
                    type="button"
                    className="ghost-button ghost-button--danger"
                    onClick={() => handleRemoveMetric(metric.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="ghost-button"
                onClick={handleAddMetric}
                aria-label="Add custom metric"
              >
                + Add metric
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="form-feedback form-feedback--error">
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div role="status" className="form-feedback form-feedback--info">
            {infoMessage}
          </div>
        )}

        <div className="form-actions">
          {isEditing && (
            <button type="button" className="ghost-button" onClick={onCancelEdit}>
              Cancel edit
            </button>
          )}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEditing ? 'Update session' : 'Save session'}
          </button>
        </div>
      </form>
    </section>
  )
}

function createEmptyFormState(date: Date, type: TrainingType): FormState {
  const baseDate = toISODateString(date)
  return {
    date: baseDate,
    type,
    title: '',
    focusArea: '',
    series: '',
    repsPerSeries: '',
    repTimesInput: '',
    recoveryTimeInput: '',
    distancePerRep: '',
    distanceUnit: DEFAULT_DISTANCE_UNIT,
    distanceSegmentsInput: '',
    weightPerRep: '',
    weightUnit: DEFAULT_WEIGHT_UNIT,
    notes: '',
    customMetrics: type === 'gym' ? [createEmptyMetric()] : [],
  }
}

function createFormStateFromSession(session: TrainingSession): FormState {
  return {
    id: session.id,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    date: session.date,
    type: session.type,
    title: session.title,
    focusArea: session.focusArea ?? '',
    series: session.series?.toString() ?? '',
    repsPerSeries: session.repsPerSeries?.toString() ?? '',
    repTimesInput: formatRepTimesForInput(session.repTimes),
    recoveryTimeInput: formatDurationForInput(session.recoveryTime),
    distancePerRep: session.distancePerRep?.toString() ?? '',
    distanceUnit: session.distanceUnit ?? DEFAULT_DISTANCE_UNIT,
    distanceSegmentsInput: formatDistanceSegmentsForInput(
      session.distanceSegments,
      session.distanceUnit ?? DEFAULT_DISTANCE_UNIT,
    ),
    weightPerRep: session.weightPerRep?.toString() ?? '',
    weightUnit: session.weightUnit ?? DEFAULT_WEIGHT_UNIT,
    notes: session.notes ?? '',
    customMetrics: (session.customMetrics ?? []).map((metric) => ({
      ...metric,
      id: metric.id || createMetricId(),
    })),
  }
}

function parsePositiveNumber(value: string, allowFloat = false): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = allowFloat ? Number(trimmed) : Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

function parseRepTimes(rawInput: string): { values: number[]; invalidSamples: string[] } {
  const segments = rawInput
    .split(/[\n,]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  const values: number[] = []
  const invalidSamples: string[] = []

  segments.forEach((segment) => {
    const parsed = parseDurationToSeconds(segment)
    if (parsed === null) {
      invalidSamples.push(segment)
    } else {
      values.push(roundToTenths(parsed))
    }
  })

  return { values, invalidSamples }
}

function parseDistanceSegments(rawInput: string): { values: number[]; invalidSamples: string[] } {
  const segments = rawInput
    .split(/[\n,]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return { values: [], invalidSamples: [] }
  }

  const values: number[] = []
  const invalidSamples: string[] = []

  segments.forEach((segment) => {
    const parsed = Number(segment)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      invalidSamples.push(segment)
    } else {
      values.push(parsed)
    }
  })

  return { values, invalidSamples }
}

function formatRepTimesForInput(repTimes: number[] | undefined): string {
  if (!repTimes || repTimes.length === 0) {
    return ''
  }

  return repTimes.map((value) => formatDurationForInput(value) || formatSeconds(value)).join('\n')
}

function formatDurationForInput(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return ''
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

function formatDistanceSegmentsForInput(
  segments: number[] | undefined,
  unit: DistanceUnit,
): string {
  if (!segments || segments.length === 0) {
    return ''
  }

  const formatValue = (value: number) => {
    if (unit === 'km') {
      return value >= 10 ? value.toFixed(1) : value.toString()
    }
    return Number.isInteger(value) ? value.toFixed(0) : value.toString()
  }

  return segments.map(formatValue).join('\n')
}

function createMetricId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createEmptyMetric(): CustomMetric {
  return {
    id: createMetricId(),
    label: '',
    value: '',
  }
}

function roundToTenths(value: number): number {
  return Math.round(value * 10) / 10
}

export default SessionForm
