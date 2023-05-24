export type CreateProductInput = {
  name: string
  price: number
  cost?: number | null
  provider?: string | null
  offShelfAt?: string | null
  description?: string | null
}

export type Product = {
  id: string
  name: string
  price: number
  cost?: number
  provider?: string
  offShelfAt?: string
  description?: string
}

export type AllProducts = Product[]
