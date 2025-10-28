import { useCallback, useEffect, useMemo, useState } from 'react'
import './styles/global.css'
import './App.css'

import DayNavigator from './components/DayNavigator'
import SessionForm from './components/SessionForm'
import SessionList from './components/SessionList'
import { deleteSession, getSessionsByDate, saveSession } from './db'
import type { TrainingSession } from './types'
import { computeDailyStats } from './utils/stats'
import { fromISODateString, toISODateString } from './utils/dates'

function App() {
  const [selectedDateISO, setSelectedDateISO] = useState(() => toISODateString(new Date()))
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null)

  const selectedDate = useMemo(() => fromISODateString(selectedDateISO), [selectedDateISO])

  const refreshSessions = useCallback(async (dateIso: string) => {
    setLoading(true)
    try {
      const records = await getSessionsByDate(dateIso)
      setSessions(records)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    getSessionsByDate(selectedDateISO)
      .then((records) => {
        if (active) {
          setSessions(records)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [selectedDateISO])

  const stats = useMemo(() => computeDailyStats(sessions), [sessions])

  const handleDateChange = (date: Date) => {
    const iso = toISODateString(date)
    setSelectedDateISO(iso)
    setEditingSession(null)
  }

  const handleSessionSave = async (session: TrainingSession) => {
    const normalizedDateISO = toISODateString(fromISODateString(session.date))
    await saveSession({ ...session, date: normalizedDateISO })

    if (normalizedDateISO === selectedDateISO) {
      await refreshSessions(normalizedDateISO)
    } else {
      setSelectedDateISO(normalizedDateISO)
    }

    setEditingSession(null)
  }

  const handleEditSession = (session: TrainingSession) => {
    setEditingSession(session)
  }

  const handleCancelEdit = () => {
    setEditingSession(null)
  }

  const handleDeleteSession = async (session: TrainingSession) => {
    if (!session.id) {
      return
    }

    const confirmDeletion =
      typeof window === 'undefined'
        ? true
        : window.confirm(
            `Remove "${session.title}" from ${session.date}? This action cannot be undone.`,
          )

    if (!confirmDeletion) {
      return
    }

    await deleteSession(session.id)
    await refreshSessions(selectedDateISO)

    if (editingSession && editingSession.id === session.id) {
      setEditingSession(null)
    }
  }

  return (
    <div className="app-shell">
      <div className="container page-container">
        <header className="app-header">
          <h1>🏃‍♀️ Track &amp; Field Planner</h1>
          <p>
            Plan and log daily training for the track. Navigate by day, capture workout structure,
            and surface key statistics instantly.
          </p>
        </header>

        <main className="page-content">
          <DayNavigator
            date={selectedDate}
            onChange={handleDateChange}
            sessions={sessions}
            stats={stats}
          />

          <div className="responsive-grid">
            <SessionForm
              selectedDate={selectedDate}
              initialSession={editingSession}
              onSave={handleSessionSave}
              onCancelEdit={handleCancelEdit}
            />
          </div>

          <SessionList
            sessions={sessions}
            loading={loading}
            onEdit={handleEditSession}
            onDelete={handleDeleteSession}
          />
        </main>
      </div>
    </div>
  )
}

export default App
