import { useMemo } from 'react'
import dayjs from 'dayjs'
import type { Spesa } from '../../types'
import './ExpenseChart.css'

interface Props {
  spese: Spesa[]
}

interface ChartPoint {
  key: string
  label: string
  value: number
}

const palette = ['#2563eb', '#7c3aed', '#10b981', '#f97316', '#ec4899', '#14b8a6']

export default function ExpenseChart({ spese }: Props) {
  const data = useMemo<ChartPoint[]>(() => {
    if (spese.length === 0) return []

    const totals = new Map<string, ChartPoint>()

    spese.forEach((spesa) => {
      const date = dayjs(spesa.data)
      if (!date.isValid()) return

      const key = date.format('YYYY-MM')
      const label = date.format('MMM YY')

      const current = totals.get(key)
      if (current) {
        current.value += spesa.importo
      } else {
        totals.set(key, { key, label, value: spesa.importo })
      }
    })

    return Array.from(totals.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6)
  }, [spese])

  const maxValue = useMemo(
    () => data.reduce((max, point) => Math.max(max, point.value), 0),
    [data],
  )

  const formatCurrency = (value: number) =>
    value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

  return (
    <div className="card chart-card">
      <h2>Andamento ultimi mesi</h2>
      {data.length === 0 ? (
        <p className="chart-empty">Registra qualche spesa per vedere il grafico.</p>
      ) : (
        <div className="chart-bars" role="img" aria-label="Spese mensili degli ultimi sei mesi">
          {data.map((point, index) => {
            const percentage = maxValue === 0 ? 0 : Math.round((point.value / maxValue) * 100)
            const width = Math.max(percentage === 0 ? 0 : 8, Math.min(100, percentage))
            const color = palette[index % palette.length]
            return (
              <div key={point.key} className="chart-row">
                <div className="chart-label">
                  <span>{point.label}</span>
                  <strong>{formatCurrency(point.value)}</strong>
                </div>
                <div className="chart-track" aria-hidden="true">
                  <div
                    className="chart-fill"
                    style={{ width: `${width}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
