import { useMemo } from 'react'
import dayjs from 'dayjs'
import type { Spesa } from '../types'

interface Props {
  spese: Spesa[]
  onDelete: (id: number) => void
}

export default function ExpenseList({ spese, onDelete }: Props) {
  const orderedSpese = useMemo(
    () =>
      [...spese].sort(
        (a, b) => dayjs(b.data).valueOf() - dayjs(a.data).valueOf(),
      ),
    [spese],
  )

  const formatCurrency = (value: number) =>
    value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

  return (
    <div className="card card-list">
      <header className="card-header">
        <h2>Ultime spese</h2>
        <p>Controlla i movimenti recenti e mantieni il budget sotto controllo.</p>
      </header>
      {orderedSpese.length === 0 ? (
        <p className="empty-state">Ancora nessuna spesa registrata.</p>
      ) : (
        <ul className="expense-list">
          {orderedSpese.map((s) => {
            const formattedDate = dayjs(s.data).format('DD MMM')
            return (
              <li
                key={s.id ?? `${s.descrizione}-${s.data}`}
                className="expense-item"
              >
                <div className="expense-main">
                  <div className="expense-tags">
                    <span className="expense-date">{formattedDate}</span>
                    {s.categoria && (
                      <span className="expense-category">{s.categoria}</span>
                    )}
                  </div>
                  <p className="expense-description">{s.descrizione}</p>
                </div>
                <div className="expense-actions">
                  <strong className="expense-amount">{formatCurrency(s.importo)}</strong>
                  <button
                    className="ghost danger"
                    title="Elimina spesa"
                    onClick={() => s.id && onDelete(s.id)}
                  >
                    🗑
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
