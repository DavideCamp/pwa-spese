import { type ChangeEvent, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { Spesa } from '../../types'
import Summary from '../../components/Summary'
import CategoryPieChart from '../../components/CategoryPieChart'
import ExpenseList from '../../components/ExpenseList'
import TrendChart from '../../components/TrendChart'
import type { TrendChartPoint } from '../../components/TrendChart'
import './DashboardPage.css'

type Period = 'week' | 'month'

interface Props {
  spese: Spesa[]
  onDelete: (id: number) => void
}

type TrendPoint = TrendChartPoint

const formatCurrency = (value: number) =>
  value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

export default function DashboardPage({ spese, onDelete }: Props) {
  const [period, setPeriod] = useState<Period>('month')
  const [weekReference, setWeekReference] = useState(() => dayjs().format('YYYY-MM-DD'))

  const weekRange = useMemo(() => {
    const referenceDate = dayjs(weekReference)
    const baseDate = referenceDate.isValid() ? referenceDate : dayjs()
    const startOfWeek = baseDate
      .startOf('day')
      .subtract((baseDate.day() + 6) % 7, 'day')
    const endOfWeek = startOfWeek.add(6, 'day').endOf('day')
    return { start: startOfWeek, end: endOfWeek }
  }, [weekReference])

  const filteredSpese = useMemo(() => {
    if (spese.length === 0) return []

    if (period === 'week') {
      return spese.filter((spesa) => {
        const dataSpesa = dayjs(spesa.data)
        if (!dataSpesa.isValid()) return false
        return (
          (dataSpesa.isAfter(weekRange.start) || dataSpesa.isSame(weekRange.start, 'day')) &&
          (dataSpesa.isBefore(weekRange.end) || dataSpesa.isSame(weekRange.end, 'day'))
        )
      })
    }

    const now = dayjs()
    const startOfMonth = now.startOf('month')

    return spese.filter((spesa) => {
      const dataSpesa = dayjs(spesa.data)
      if (!dataSpesa.isValid()) return false
      return dataSpesa.isAfter(startOfMonth) || dataSpesa.isSame(startOfMonth, 'day')
    })
  }, [spese, period, weekRange])

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

    const totalsByDay = filteredSpese.reduce<Map<string, number>>((acc, spesa) => {
      const key = dayjs(spesa.data).format('YYYY-MM-DD')
      acc.set(key, (acc.get(key) ?? 0) + spesa.importo)
      return acc
    }, new Map())

    if (period === 'week') {
      const start = weekRange.start.startOf('day')
      return Array.from({ length: 7 }, (_, index) => {
        const date = start.add(index, 'day')
        const key = date.format('YYYY-MM-DD')
        return {
          key,
          label: date.format('dd'),
          value: totalsByDay.get(key) ?? 0,
        }
      })
    }

    const now = dayjs()
    const days = Math.max(1, now.date())
    const start = now.startOf('month')

    return Array.from({ length: days }, (_, index) => {
      const date = start.add(index, 'day')
      const key = date.format('YYYY-MM-DD')
      return {
        key,
        label: date.format('DD'),
        value: totalsByDay.get(key) ?? 0,
      }
    })
  }, [filteredSpese, period, weekRange])

  const maxTrendValue = useMemo(
    () => trend.reduce((max, point) => Math.max(max, point.value), 0),
    [trend],
  )

  const periodLabel =
    period === 'week'
      ? `Settimana ${weekRange.start.format('DD MMM')} – ${weekRange.end.format('DD MMM')}`
      : 'Mese corrente'

  const handleChangePeriod = (value: Period) => {
    setPeriod(value)
  }

  const handleWeekReferenceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    if (!value) {
      setWeekReference(dayjs().format('YYYY-MM-DD'))
      return
    }

    const parsed = dayjs(value)
    if (parsed.isValid()) {
      setWeekReference(parsed.format('YYYY-MM-DD'))
    }
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
            <div className="period-controls">
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
              {period === 'week' && (
                <label className="week-picker">
                  <span className="week-picker-label">Data di riferimento</span>
                  <input
                    type="date"
                    value={weekReference}
                    onChange={handleWeekReferenceChange}
                    max={dayjs().format('YYYY-MM-DD')}
                  />
                </label>
              )}
            </div>
          </header>

        

          <div className="period-trend">
            <h3>Trend giornaliero</h3>
            {trend.length === 0 || maxTrendValue === 0 ? (
              <p className="chart-empty">
                Registra qualche spesa per vedere il trend dell&apos;intervallo scelto.
              </p>
            ) : (
              <TrendChart
                data={trend}
                maxValue={maxTrendValue}
                yFormatter={formatCurrency}
                ariaLabel={`Trend spese per ${periodLabel.toLowerCase()}`}
              />
            )}
          </div>

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
