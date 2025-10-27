import { useMemo } from 'react'
import './TrendChart.css'

export interface TrendChartPoint {
  key: string
  label: string
  value: number
}

interface Props {
  data: TrendChartPoint[]
  maxValue: number
  yFormatter: (value: number) => string
  ariaLabel: string
}

const PADDING = {
  top: 24,
  right: 24,
  bottom: 40,
  left: 56,
}
const HEIGHT = 280

export default function TrendChart({ data, maxValue, yFormatter, ariaLabel }: Props) {
  const gradientId = useMemo(
    () => `trendChartFill-${Math.random().toString(36).slice(2, 10)}`,
    [],
  )

  const { width, chartHeight, points, yTicks } = useMemo(() => {
    const width = Math.max(320, data.length * 72)
    const chartHeight = HEIGHT - PADDING.top - PADDING.bottom
    const step =
      data.length <= 1
        ? 0
        : (width - PADDING.left - PADDING.right) / (data.length - 1)

    const safeMax = maxValue <= 0 ? 1 : maxValue

    const points = data.map((point, index) => {
      const x =
        data.length <= 1
          ? PADDING.left + (width - PADDING.left - PADDING.right) / 2
          : PADDING.left + index * step
      const valueRatio = Math.min(point.value / safeMax, 1)
      const y = PADDING.top + (1 - valueRatio) * chartHeight
      return { ...point, x, y }
    })

    const yTicks = Array.from({ length: 4 }, (_, idx) => {
      const ratio = idx / 3
      const value = safeMax * (1 - ratio)
      const y = PADDING.top + ratio * chartHeight
      return { y, value }
    })

    return { width, chartHeight, points, yTicks }
  }, [data, maxValue])

  if (data.length === 0) return null

  const areaPath = buildAreaPath(points, chartHeight)
  const linePath = buildLinePath(points)

  return (
    <div className="trend-chart" role="img" aria-label={ariaLabel}>
      <svg
        className="trend-chart-svg"
        viewBox={`0 0 ${width} ${HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(37, 99, 235, 0.35)" />
            <stop offset="100%" stopColor="rgba(37, 99, 235, 0.05)" />
          </linearGradient>
        </defs>

        <line
          x1={PADDING.left}
          y1={HEIGHT - PADDING.bottom}
          x2={width - PADDING.right}
          y2={HEIGHT - PADDING.bottom}
          className="trend-chart-axis"
        />

        {yTicks.map((tick) => (
          <g key={tick.y} className="trend-chart-tick">
            <line
              x1={PADDING.left}
              x2={width - PADDING.right}
              y1={tick.y}
              y2={tick.y}
              className="trend-chart-gridline"
            />
            <text x={PADDING.left - 12} y={tick.y + 4} className="trend-chart-y-label">
              {yFormatter(tick.value)}
            </text>
          </g>
        ))}

        {areaPath && (
          <path d={areaPath} className="trend-chart-area" fill={`url(#${gradientId})`} />
        )}
        {linePath && <path d={linePath} className="trend-chart-line" />}

        {points.map((point) => (
          <g key={point.key} className="trend-chart-point">
            <circle cx={point.x} cy={point.y} r={5} />
            <text x={point.x} y={HEIGHT - 12} className="trend-chart-x-label">
              {point.label}
            </text>
            <title>
              {point.label} · {yFormatter(point.value)}
            </title>
          </g>
        ))}
      </svg>
    </div>
  )
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return null
  const [first, ...rest] = points
  const commands = rest.map((point) => `L ${point.x} ${point.y}`)
  return `M ${first.x} ${first.y} ${commands.join(' ')}`
}

function buildAreaPath(
  points: Array<{ x: number; y: number }>,
  chartHeight: number,
) {
  if (points.length === 0) return null
  const baseline = PADDING.top + chartHeight
  const [first, ...rest] = points
  const commands = rest.map((point) => `L ${point.x} ${point.y}`)
  return `M ${first.x} ${first.y} ${commands.join(' ')} L ${
    points[points.length - 1].x
  } ${baseline} L ${first.x} ${baseline} Z`
}
