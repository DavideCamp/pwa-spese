import { openDB } from 'idb'
import type { TrainingSession } from './types'

const DB_NAME = 'trainingSessionsDB'
const DB_VERSION = 1
const STORE_NAME = 'sessions'
const DATE_INDEX = 'by-date'

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion, transaction) {
      let store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        })
      } else if (transaction) {
        store = transaction.objectStore(STORE_NAME)
      }

      if (store && !store.indexNames.contains(DATE_INDEX)) {
        store.createIndex(DATE_INDEX, 'date')
      }
    },
  })
}

export async function getAllSessions(): Promise<TrainingSession[]> {
  const db = await getDB()
  const sessions = await db.getAll(STORE_NAME)
  return sessions.sort(sortByDateAndTime)
}

export async function getSessionsByDate(date: string): Promise<TrainingSession[]> {
  const db = await getDB()
  const index = db.transaction(STORE_NAME).store.index(DATE_INDEX)
  const sessions = await index.getAll(date)
  return sessions.sort(sortByDateAndTime)
}

export async function saveSession(session: TrainingSession): Promise<TrainingSession> {
  const db = await getDB()
  const now = new Date().toISOString()

  const cleanRepTimes =
    session.repTimes?.filter((value) => typeof value === 'number' && Number.isFinite(value)) ?? []

  const { id: sessionId, ...sessionWithoutId } = session

  const cleanDistanceSegments =
    session.distanceSegments?.filter(
      (value) => typeof value === 'number' && Number.isFinite(value) && value > 0,
    ) ?? []

  const record: TrainingSession = {
    ...sessionWithoutId,
    repTimes: cleanRepTimes,
    distanceSegments: cleanDistanceSegments.length > 0 ? cleanDistanceSegments : undefined,
    createdAt: session.createdAt ?? now,
    updatedAt: now,
  }

  if (isValidStoreKey(sessionId)) {
    record.id = sessionId
  }

  const key = await db.put(STORE_NAME, record)

  const numericId =
    typeof key === 'number' && Number.isFinite(key)
      ? key
      : typeof key === 'string'
        ? Number.parseInt(key, 10)
        : sessionId

  const normalizedId =
    typeof numericId === 'number' && Number.isFinite(numericId)
      ? numericId
      : isValidStoreKey(sessionId)
        ? sessionId
        : undefined

  return {
    ...record,
    id: normalizedId,
  }
}

export async function deleteSession(id: number) {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

function sortByDateAndTime(a: TrainingSession, b: TrainingSession) {
  if (a.date !== b.date) {
    return a.date.localeCompare(b.date)
  }
  return (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
}

function isValidStoreKey(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
