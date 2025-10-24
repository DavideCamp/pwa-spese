import { useState } from 'react'
import type { Categoria } from '../types'

interface Props {
  categorie: Categoria[]
  onAdd: (nome: string) => void
  onDelete: (id: number) => void
}

export default function CategoryManager({ categorie, onAdd, onDelete }: Props) {
  const [nome, setNome] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome) return
    onAdd(nome)
    setNome('')
  }

  return (
    <div className="card card-categories">
      <header className="card-header">
        <h2>Categorie personalizzate</h2>
        <p>Crea etichette per raggruppare le spese in modo più preciso.</p>
      </header>
      <form className="inline-form" onSubmit={handleAdd}>
        <label className="field">
          <span className="field-label">Nome categoria</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Es. Trasporti"
          />
        </label>
        <button className="secondary" type="submit">
          Aggiungi
        </button>
      </form>
      {categorie.length === 0 ? (
        <p className="empty-state">Nessuna categoria: inizia aggiungendone una.</p>
      ) : (
        <ul className="category-list">
          {categorie.map((c) => (
            <li key={c.id} className="category-item">
              <span className="category-name">{c.nome}</span>
              <button
                className="ghost danger"
                title="Elimina categoria"
                onClick={() => c.id && onDelete(c.id)}
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
