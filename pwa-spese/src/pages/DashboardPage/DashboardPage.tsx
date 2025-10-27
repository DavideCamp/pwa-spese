import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { Spesa } from '../../types'
import Summary from '../../components/Summary'
import CategoryPieChart from '../../components/CategoryPieChart'
import ExpenseList from '../../components/ExpenseList'
import './DashboardPage.css'

type Period = 'week' | 'month'

interface Props {
  spese: Spesa[]
  onDelete: (id: number) => void
}

interface TrendPoint {
  key: string
  label: string
  value: number
}

const formatCurrency = (value: number) =>
  value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

export default function DashboardPage({ spese, onDelete }: Props) {
  const [period, setPeriod] = useState<Period>('month')

  const filteredSpese = useMemo(() => {
    if (spese.length === 0) return []

    const now = dayjs()
    const limit =
      period === 'week'
        ? now.subtract(6, 'day').startOf('day')
        : now.startOf('month')

    return spese.filter((spesa) => {
      const dataSpesa = dayjs(spesa.data)
      if (!dataSpesa.isValid()) return false
      return dataSpesa.isAfter(limit) || dataSpesa.isSame(limit, 'day')
    })
  }, [spese, period])

  const stats = useMemo(() => {
    if (filteredSpese.length === 0) {
      return {
        total: 0,
        count: 0,
        average: 0,
        topCategory: null as { label: string; value: number } | null,
        peak: null as Spesa | null,
      }
    }

    const total = filteredSpese.reduce((sum, spesa) => sum + spesa.importo, 0)
    const count = filteredSpese.length
    const average = total / count

    const peak = filteredSpese.reduce<Spesa | null>((max, spesa) => {
      if (!max || spesa.importo > max.importo) return spesa
      return max
    }, null)

    const perCategory = filteredSpese.reduce<Map<string, number>>((acc, spesa) => {
      const key = spesa.categoria?.trim() || 'Senza categoria'
      acc.set(key, (acc.get(key) ?? 0) + spesa.importo)
      return acc
    }, new Map())

    let topCategory: { label: string; value: number } | null = null
    perCategory.forEach((value, key) => {
      if (!topCategory || value > topCategory.value) {
        topCategory = { label: key, value }
      }
    })

    return {
      total,
      count,
      average,
      topCategory,
      peak,
    }
  }, [filteredSpese])

  const trend = useMemo<TrendPoint[]>(() => {
    if (filteredSpese.length === 0) return []

    const now = dayjs()
    const days =
      period === 'week' ? 7 : Math.max(1, now.date())
    const start =
      period === 'week'
        ? now.subtract(days - 1, 'day').startOf('day')
        : now.startOf('month')

    const totalsByDay = filteredSpese.reduce<Map<string, number>>((acc, spesa) => {
      const key = dayjs(spesa.data).format('YYYY-MM-DD')
      acc.set(key, (acc.get(key) ?? 0) + spesa.importo)
      return acc
    }, new Map())

    return Array.from({ length: days }, (_, index) => {
      const date = start.add(index, 'day')
      const key = date.format('YYYY-MM-DD')
      const label = period === 'week' ? date.format('dd') : date.format('DD')
      return {
        key,
        label,
        value: totalsByDay.get(key) ?? 0,
      }
    })
  }, [filteredSpese, period])

  const maxTrendValue = useMemo(
    () => trend.reduce((max, point) => Math.max(max, point.value), 0),
    [trend],
  )

  const periodLabel =
    period === 'week' ? 'Ultimi 7 giorni' : 'Mese corrente'

  const handleChangePeriod = (value: Period) => {
    setPeriod(value)
  }

  return (
    <div className="dashboard">
      <section className="dashboard-item dashboard-overview">
        <div className="card period-card">
          <header className="card-header period-card-header">
            <div>
              <h2>Panoramica</h2>
              <p>Visualizza l&rsquo;andamento delle spese per periodo selezionato.</p>
            </div>
            <div className="period-toggle" role="tablist" aria-label="Filtro periodo">
              <button
                type="button"
                role="tab"
                aria-selected={period === 'week'}
                className={`period-toggle-button ${period === 'week' ? 'active' : ''}`}
                onClick={() => handleChangePeriod('week')}
              >
                Settimana
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={period === 'month'}
                className={`period-toggle-button ${period === 'month' ? 'active' : ''}`}
                onClick={() => handleChangePeriod('month')}
              >
                Mese
              </button>
            </div>
          </header>

          <div className="period-summary">
            <div className="period-summary-item">
              <span className="summary-label">{periodLabel}</span>
              <strong className="summary-value">{formatCurrency(stats.total)}</strong>
            </div>
            <div className="period-summary-item">
              <span className="summary-label">Transazioni</span>
              <strong className="summary-value">{stats.count}</strong>
            </div>
            <div className="period-summary-item">
              <span className="summary-label">Spesa media</span>
              <strong className="summary-value">
                {stats.count === 0 ? '—' : formatCurrency(stats.average)}
              </strong>
            </div>
            <div className="period-summary-item">
              <span className="summary-label">Categoria top</span>
              <strong className="summary-value">
                {stats.topCategory
                  ? `${stats.topCategory.label} · ${formatCurrency(stats.topCategory.value)}`
                  : '—'}
              </strong>
            </div>
          </div>

          <div className="period-trend">
            <h3>Trend giornaliero</h3>
            {trend.length === 0 || maxTrendValue === 0 ? (
              <p className="chart-empty">
                Registra qualche spesa per vedere il trend dell&apos;intervallo scelto.
              </p>
            ) : (
              <div
                className="trend-chart"
                role="img"
                aria-label={`Trend spese per ${periodLabel.toLowerCase()}`}
              >
                {trend.map((point) => {
                  const height =
                    maxTrendValue === 0
                      ? 0
                      : Math.max(12, Math.round((point.value / maxTrendValue) * 100))
                  return (
                    <div key={point.key} className="trend-col">
                      <div
                        className="trend-bar"
                        style={{ height: `${height}%` }}
                        title={`${point.label} · ${formatCurrency(point.value)}`}
                        aria-hidden="true"
                      />
                      <span className="trend-label">{point.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-item dashboard-summary">
        <Summary spese={filteredSpese} />
      </section>

      <section className="dashboard-item dashboard-pie">
        <CategoryPieChart spese={filteredSpese} />
      </section>

      <section className="dashboard-item dashboard-list">
        <ExpenseList spese={filteredSpese} onDelete={onDelete} />
      </section>
    </div>
  )
}
