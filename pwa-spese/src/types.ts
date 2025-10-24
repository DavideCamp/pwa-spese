export interface Spesa {
  id?: number
  descrizione: string
  importo: number
  categoria: string
  data: string
}

export interface Categoria {
  id?: number
  nome: string
}
