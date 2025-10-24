import { useMemo } from 'react'
import type { Spesa } from '../types'

interface Props {
  spese: Spesa[]
}

interface Slice {
  label: string
  value: number
  color: string
  percentage: number
}

const palette = [
  '#2563eb',
  '#7c3aed',
  '#10b981',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#facc15',
  '#22d3ee',
]

const size = 220
const radius = 90
const circumference = 2 * Math.PI * radius

export default function CategoryPieChart({ spese }: Props) {
  const { slices, total } = useMemo(() => {
    if (spese.length === 0) return { slices: [] as Slice[], total: 0 }

    const totals = new Map<string, number>()

    spese.forEach((spesa) => {
      const key = spesa.categoria?.trim() || 'Senza categoria'
      totals.set(key, (totals.get(key) ?? 0) + spesa.importo)
    })

    const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])
    const sum = entries.reduce((acc, [, value]) => acc + value, 0)

    const data = entries.map<Slice>(([label, value], index) => ({
      label,
      value,
      color: palette[index % palette.length],
      percentage: sum === 0 ? 0 : (value / sum) * 100,
    }))

    return { slices: data, total: sum }
  }, [spese])

  const formatCurrency = (value: number) =>
    value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

  let cumulative = 0

  return (
    <div className="card chart-card pie-card">
      <h2>Distribuzione categorie</h2>
      {slices.length === 0 || total === 0 ? (
        <p className="chart-empty">
          Aggiungi alcune spese e vedrai la suddivisione per categoria.
        </p>
      ) : (
        <div className="pie-wrapper">
          <svg
            className="pie-chart"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="Percentuale di spesa per categoria"
          >
            <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
              {slices.map((slice) => {
                const segmentLength = (slice.value / total) * circumference
                const strokeDasharray = `${segmentLength} ${circumference}`
                const offset = -cumulative
                cumulative += segmentLength
                return (
                  <circle
                    key={slice.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={24}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                )
              })}
            </g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius - 26}
              fill="var(--surface)"
              className="pie-inner"
            />
            <text x="50%" y="45%" textAnchor="middle" className="pie-total-label">
              Totale
            </text>
            <text x="50%" y="58%" textAnchor="middle" className="pie-total-value">
              {formatCurrency(total)}
            </text>
          </svg>
          <ul className="pie-legend">
            {slices.map((slice) => (
              <li key={slice.label}>
                <span className="legend-dot" style={{ backgroundColor: slice.color }} />
                <div className="legend-info">
                  <span className="legend-label">{slice.label}</span>
                  <span className="legend-value">
                    {formatCurrency(slice.value)} · {slice.percentage.toFixed(1)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
