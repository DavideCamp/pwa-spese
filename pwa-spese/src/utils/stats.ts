import type { TrainingSession, TrainingStats } from '../types'

export function computeDailyStats(sessions: TrainingSession[]): TrainingStats {
  const repTimes = sessions.flatMap((session) => session.repTimes ?? [])
  const validRepTimes = repTimes.filter((value) => Number.isFinite(value) && value >= 0)
  const totalRepTime = validRepTimes.reduce((acc, value) => acc + value, 0)
  const averageRepTimeSeconds =
    validRepTimes.length > 0 ? totalRepTime / validRepTimes.length : null

  const totalDistanceKm = sessions
    .filter((session) => session.type === 'running')
    .reduce((accumulator, session) => accumulator + computeSessionDistanceKm(session), 0)

  const totalWeightKg = sessions
    .filter((session) => session.type === 'gym')
    .reduce((accumulator, session) => accumulator + computeSessionWeightKg(session), 0)

  return {
    averageRepTimeSeconds,
    totalDistanceKm,
    totalWeightKg,
  }
}

export function computeSessionDistanceKm(session: TrainingSession): number {
  if (session.type !== 'running') {
    return 0
  }

  const hasDistanceSegments =
    Array.isArray(session.distanceSegments) && session.distanceSegments.length > 0

  if (hasDistanceSegments) {
    const perSeriesDistance =
      session.distanceSegments?.reduce((accumulator, value) => accumulator + value, 0) ?? 0
    const perSeriesMeters =
      session.distanceUnit === 'km' ? perSeriesDistance * 1000 : perSeriesDistance
    const seriesCount = session.series ?? 1

    if (perSeriesMeters <= 0 || seriesCount <= 0) {
      return 0
    }

    return (perSeriesMeters * seriesCount) / 1000
  }

  const distancePerRep = session.distancePerRep ?? 0
  const repsPerSeries = session.repsPerSeries ?? 0
  const series = session.series ?? 0

  if (distancePerRep <= 0 || repsPerSeries <= 0 || series <= 0) {
    return 0
  }

  const totalDistance = distancePerRep * repsPerSeries * series
  return session.distanceUnit === 'km' ? totalDistance : totalDistance / 1000
}

export function computeSessionWeightKg(session: TrainingSession): number {
  if (session.type !== 'gym') {
    return 0
  }

  const weightPerRep = session.weightPerRep ?? 0
  const repsPerSeries = session.repsPerSeries ?? 0
  const series = session.series ?? 0

  if (weightPerRep <= 0 || repsPerSeries <= 0 || series <= 0) {
    return 0
  }

  const totalWeight = weightPerRep * repsPerSeries * series
  return session.weightUnit === 'lb' ? totalWeight * 0.453592 : totalWeight
}

export function getSessionAverageRepTime(session: TrainingSession): number | null {
  const repTimes = session.repTimes ?? []
  const validRepTimes = repTimes.filter((value) => Number.isFinite(value) && value >= 0)
  if (validRepTimes.length === 0) {
    return null
  }
  const sum = validRepTimes.reduce((acc, value) => acc + value, 0)
  return sum / validRepTimes.length
}
