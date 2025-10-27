import dayjs from 'dayjs'
import type { Spesa } from '../../types'
import './Summary.css'

interface Props {
  spese: Spesa[]
}

export default function Summary({ spese }: Props) {
  const oggi = dayjs()
  const settimana = oggi.subtract(7, 'day')
  const mese = oggi.startOf('month')
  const ultimi30 = oggi.subtract(30, 'day')
  const formatCurrency = (value: number) =>
    value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

  const totaleSett = spese
    .filter((s) => dayjs(s.data).isAfter(settimana))
    .reduce((sum, s) => sum + s.importo, 0)

  const totaleMese = spese
    .filter((s) => dayjs(s.data).isAfter(mese))
    .reduce((sum, s) => sum + s.importo, 0)

  const totale = spese.reduce((sum, s) => sum + s.importo, 0)

  const ultimeSpese = spese.filter((s) => dayjs(s.data).isAfter(ultimi30))
  const totale30 = ultimeSpese.reduce((sum, s) => sum + s.importo, 0)
  const giorniConsiderati = Math.max(1, oggi.diff(ultimi30, 'day'))
  const mediaGiornaliera = totale30 / giorniConsiderati

  const spesaPerCategoria = ultimeSpese.reduce<Map<string, number>>((acc, s) => {
    if (!s.categoria) return acc
    acc.set(s.categoria, (acc.get(s.categoria) ?? 0) + s.importo)
    return acc
  }, new Map())

  let categoriaTop: string | null = null
  let importoTop = 0
  spesaPerCategoria.forEach((val, key) => {
    if (val > importoTop) {
      importoTop = val
      categoriaTop = key
    }
  })

  const spesaPerMetodo = ultimeSpese.reduce<Map<string, number>>((acc, s) => {
    const key = s.metodoPagamento?.trim() || 'Altro'
    acc.set(key, (acc.get(key) ?? 0) + s.importo)
    return acc
  }, new Map())

  let metodoTop: string | null = null
  let metodoTopImporto = 0
  spesaPerMetodo.forEach((val, key) => {
    if (val > metodoTopImporto) {
      metodoTopImporto = val
      metodoTop = key
    }
  })

  return (
    <div className="card summary-card">
      <header className="card-header">
        <h2>Riepilogo rapido</h2>
        <p>Una panoramica dei dati principali delle tue spese.</p>
      </header>
      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Ultimi 7 giorni</span>
          <strong className="summary-value">{formatCurrency(totaleSett)}</strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">Questo mese</span>
          <strong className="summary-value">{formatCurrency(totaleMese)}</strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">Media giornaliera (30g)</span>
          <strong className="summary-value">{formatCurrency(mediaGiornaliera)}</strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">Categoria principale (30g)</span>
          <strong className="summary-value">
            {categoriaTop ? `${categoriaTop} · ${formatCurrency(importoTop)}` : '—'}
          </strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">Metodo preferito (30g)</span>
          <strong className="summary-value">
            {metodoTop ? `${metodoTop} · ${formatCurrency(metodoTopImporto)}` : '—'}
          </strong>
        </div>
        <div className="summary-item summary-total">
          <span className="summary-label">Totale complessivo</span>
          <strong className="summary-value">{formatCurrency(totale)}</strong>
        </div>
      </div>
    </div>
  )
}
