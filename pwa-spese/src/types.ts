export type TrainingType = 'running' | 'gym'

export type DistanceUnit = 'm' | 'km'
export type WeightUnit = 'kg' | 'lb'

export interface CustomMetric {
  id: string
  label: string
  value: string
}

export interface TrainingSession {
  id?: number
  date: string
  type: TrainingType
  title: string
  focusArea?: string
  series?: number | null
  repsPerSeries?: number | null
  repTimes?: number[]
  distanceSegments?: number[]
  recoveryTime?: number | null
  distancePerRep?: number | null
  distanceUnit?: DistanceUnit
  weightPerRep?: number | null
  weightUnit?: WeightUnit
  customMetrics?: CustomMetric[]
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface TrainingStats {
  averageRepTimeSeconds: number | null
  totalDistanceKm: number
  totalWeightKg: number
}
