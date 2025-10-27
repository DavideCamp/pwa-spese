import { useEffect, useMemo, useState } from 'react'
import {
  getSpese,
  addSpesa,
  deleteSpesa,
  getCategorie,
  addCategoria,
  deleteCategoria,
  getMetodiPagamento,
  addMetodoPagamento,
  deleteMetodoPagamento,
} from './db'
import type { Spesa, Categoria, MetodoPagamento } from './types'

import './styles/global.css'
import './App.css'
import CategoryManager from './components/CategoryManager'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import PaymentMethodManager from './components/PaymentMethodManager'
import DashboardPage from './pages/DashboardPage'

type View = 'dashboard' | 'add' | 'manage'

function App() {
  const [spese, setSpese] = useState<Spesa[]>([])
  const [categorie, setCategorie] = useState<Categoria[]>([])
  const [metodiPagamento, setMetodiPagamento] = useState<MetodoPagamento[]>([])
  const [activeView, setActiveView] = useState<View>('dashboard')

  useEffect(() => {
    refreshData()
  }, [])

  async function refreshData() {
    setSpese(await getSpese())
    setCategorie(await getCategorie())
    setMetodiPagamento(await getMetodiPagamento())
  }

  async function handleAddSpesa(s: Spesa) {
    await addSpesa(s)
    refreshData()
  }

  async function handleDeleteSpesa(id: number) {
    await deleteSpesa(id)
    refreshData()
  }

  async function handleAddCategoria(nome: string) {
    await addCategoria({ nome })
    refreshData()
  }

  async function handleDeleteCategoria(id: number) {
    await deleteCategoria(id)
    refreshData()
  }

  async function handleAddMetodo(nome: string) {
    await addMetodoPagamento({ nome })
    refreshData()
  }

  async function handleDeleteMetodo(id: number) {
    await deleteMetodoPagamento(id)
    refreshData()
  }

  const pageCopy = useMemo<Record<View, { title: string; subtitle: string }>>(
    () => ({
      dashboard: {
        title: 'Cruscotto spese',
        subtitle: 'Analizza gli andamenti e filtra rapidamente per settimana o mese.',
      },
      add: {
        title: 'Registra una spesa',
        subtitle: 'Inserisci una nuova voce e tieni aggiornata la tua lista.',
      },
      manage: {
        title: 'Gestisci categorie e metodi',
        subtitle: 'Personalizza le etichette per classificare le spese con precisione.',
      },
    }),
    [],
  )

  const { title, subtitle } = pageCopy[activeView]

  return (
    <div className="app-shell">
      <div className="container page-container">
        <header className="app-header">
          <h1>
            💰 <span>{title}</span>
          </h1>
          <p>{subtitle}</p>
        </header>

        <main className="page-content">
          {activeView === 'dashboard' && (
            <DashboardPage spese={spese} onDelete={handleDeleteSpesa} />
          )}

          {activeView === 'add' && (
            <section className="page-section">
              <ExpenseForm
                onAdd={handleAddSpesa}
                categorie={categorie}
                metodiPagamento={metodiPagamento}
              />
              <div className="page-section">
                <ExpenseList spese={spese} onDelete={handleDeleteSpesa} />
              </div>
            </section>
          )}

          {activeView === 'manage' && (
            <div className="manage-grid">
              <CategoryManager
                categorie={categorie}
                onAdd={handleAddCategoria}
                onDelete={handleDeleteCategoria}
              />
              <PaymentMethodManager
                metodi={metodiPagamento}
                onAdd={handleAddMetodo}
                onDelete={handleDeleteMetodo}
              />
            </div>
          )}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Navigazione principale">
        <button
          type="button"
          className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          <span className="nav-icon" aria-hidden="true">
            📊
          </span>
          <span className="nav-label">Dashboard</span>
        </button>
        <button
          type="button"
          className={`nav-item nav-primary ${activeView === 'add' ? 'active' : ''}`}
          onClick={() => setActiveView('add')}
          aria-label="Aggiungi spesa"
        >
          <span className="nav-icon" aria-hidden="true">
            +
          </span>
        </button>
        <button
          type="button"
          className={`nav-item ${activeView === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveView('manage')}
        >
          <span className="nav-icon" aria-hidden="true">
            🛠️
          </span>
          <span className="nav-label">Gestione</span>
        </button>
      </nav>
    </div>
  )
}

export default App
