import { useEffect, useState } from 'react'
import {
  getSpese,
  addSpesa,
  deleteSpesa,
  getCategorie,
  addCategoria,
  deleteCategoria,
} from './db'
import type { Spesa, Categoria } from './types'

import './style.css'
import CategoryManager from './components/CategoryManager'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import Summary from './components/Summary'
import ExpenseChart from './components/ExpenseChart'
import CategoryPieChart from './components/CategoryPieChart'

function App() {
  const [spese, setSpese] = useState<Spesa[]>([])
  const [categorie, setCategorie] = useState<Categoria[]>([])

  useEffect(() => {
    refreshData()
  }, [])

  async function refreshData() {
    setSpese(await getSpese())
    setCategorie(await getCategorie())
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

  return (
    <div className="container">
      <header className="app-header">
        <h1>
          💰 <span>Gestione Spese</span>
        </h1>
        <p>
          Un cruscotto moderno per registrare le spese, monitorare le categorie e vedere subito
          l&rsquo;andamento.
        </p>
      </header>

      <main className="dashboard">
        <section className="dashboard-item dashboard-form">
          <ExpenseForm onAdd={handleAddSpesa} categorie={categorie} />
        </section>
        <section className="dashboard-item dashboard-summary">
          <Summary spese={spese} />
        </section>
        <section className="dashboard-item dashboard-chart">
          <ExpenseChart spese={spese} />
        </section>
        <section className="dashboard-item dashboard-pie">
          <CategoryPieChart spese={spese} />
        </section>
        <section className="dashboard-item dashboard-list">
          <ExpenseList spese={spese} onDelete={handleDeleteSpesa} />
        </section>
        <section className="dashboard-item dashboard-categories">
          <CategoryManager
            categorie={categorie}
            onAdd={handleAddCategoria}
            onDelete={handleDeleteCategoria}
          />
        </section>
      </main>
    </div>
  )
}

export default App
