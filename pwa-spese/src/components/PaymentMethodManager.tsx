import { useState } from 'react'
import type { MetodoPagamento } from '../types'

interface Props {
  metodi: MetodoPagamento[]
  onAdd: (nome: string) => void
  onDelete: (id: number) => void
}

export default function PaymentMethodManager({ metodi, onAdd, onDelete }: Props) {
  const [nome, setNome] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    onAdd(nome.trim())
    setNome('')
  }

  return (
    <div className="card card-methods">
      <header className="card-header">
        <h2>Metodi di pagamento</h2>
        <p>Gestisci contanti, carte e altri metodi per analizzare al meglio le spese.</p>
      </header>
      <form className="inline-form" onSubmit={handleAdd}>
        <label className="field">
          <span className="field-label">Nuovo metodo</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Es. Carta di credito"
          />
        </label>
        <button className="secondary" type="submit">
          Aggiungi
        </button>
      </form>
      {metodi.length === 0 ? (
        <p className="empty-state">Nessun metodo salvato: aggiungine uno per iniziare.</p>
      ) : (
        <ul className="method-list">
          {metodi.map((metodo) => (
            <li key={metodo.id} className="method-item">
              <span className="method-name">{metodo.nome}</span>
              <button
                className="ghost danger"
                title="Elimina metodo"
                onClick={() => metodo.id && onDelete(metodo.id)}
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
