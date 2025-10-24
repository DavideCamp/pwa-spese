export interface Spesa {
  id?: number
  descrizione: string
  importo: number
  categoria: string
  metodoPagamento: string
  data: string
}

export interface Categoria {
  id?: number
  nome: string
}

export interface MetodoPagamento {
  id?: number
  nome: string
}
