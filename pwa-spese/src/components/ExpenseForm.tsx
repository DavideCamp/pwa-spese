import { useState } from 'react'
import type { Spesa, Categoria, MetodoPagamento } from '../types'
import dayjs from 'dayjs'

interface Props {
  onAdd: (s: Spesa) => void
  categorie: Categoria[]
  metodiPagamento: MetodoPagamento[]
}

export default function ExpenseForm({ onAdd, categorie, metodiPagamento }: Props) {
  const [descrizione, setDescrizione] = useState('')
  const [importo, setImporto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [metodoPagamento, setMetodoPagamento] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!descrizione || !importo) return
    onAdd({
      descrizione,
      importo: parseFloat(importo),
      categoria,
      metodoPagamento,
      data: dayjs().format('YYYY-MM-DD'),
    })
    setDescrizione('')
    setImporto('')
    setCategoria('')
    setMetodoPagamento('')
  }

  return (
    <form className="card card-form" onSubmit={handleSubmit}>
      <header className="card-header">
        <h2>Registra una spesa</h2>
        <p>Compila i campi e tieni traccia delle uscite in pochi tocchi.</p>
      </header>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">Descrizione</span>
          <input
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            placeholder="Es. Spesa settimanale"
          />
        </label>
        <label className="field">
          <span className="field-label">Importo</span>
          <input
            value={importo}
            onChange={(e) => setImporto(e.target.value)}
            type="number"
            placeholder="€ 0,00"
            min="0"
            step="0.01"
          />
        </label>
        <label className="field">
          <span className="field-label">Categoria</span>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Seleziona categoria</option>
            {categorie.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Metodo di pagamento</span>
          <select
            value={metodoPagamento}
            onChange={(e) => setMetodoPagamento(e.target.value)}
          >
            <option value="">Seleziona metodo</option>
            {metodiPagamento.map((m) => (
              <option key={m.id} value={m.nome}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className="primary" type="submit">
        Salva spesa
      </button>
    </form>
  )
}
