import { openDB } from 'idb'
import type { Spesa, Categoria, MetodoPagamento } from './types'

export async function getDB() {
  return openDB('speseDB', 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('spese')) {
        db.createObjectStore('spese', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('categorie')) {
        db.createObjectStore('categorie', { keyPath: 'id', autoIncrement: true })
      }
      if (oldVersion < 2 && !db.objectStoreNames.contains('metodiPagamento')) {
        db.createObjectStore('metodiPagamento', { keyPath: 'id', autoIncrement: true })
      }
    },
  })
}

// --- SPESE ---
export async function getSpese(): Promise<Spesa[]> {
  const db = await getDB()
  return db.getAll('spese')
}

export async function addSpesa(spesa: Spesa) {
  const db = await getDB()
  await db.add('spese', spesa)
}

export async function deleteSpesa(id: number) {
  const db = await getDB()
  await db.delete('spese', id)
}

// --- CATEGORIE ---
export async function getCategorie(): Promise<Categoria[]> {
  const db = await getDB()
  return db.getAll('categorie')
}

export async function addCategoria(cat: Categoria) {
  const db = await getDB()
  await db.add('categorie', cat)
}

export async function deleteCategoria(id: number) {
  const db = await getDB()
  await db.delete('categorie', id)
}

// --- METODI PAGAMENTO ---
export async function getMetodiPagamento(): Promise<MetodoPagamento[]> {
  const db = await getDB()
  return db.getAll('metodiPagamento')
}

export async function addMetodoPagamento(metodo: MetodoPagamento) {
  const db = await getDB()
  await db.add('metodiPagamento', metodo)
}

export async function deleteMetodoPagamento(id: number) {
  const db = await getDB()
  await db.delete('metodiPagamento', id)
}
