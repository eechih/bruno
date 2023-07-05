export type Product = {
  id: string
  name: string
  description?: string
  price?: number
  cost?: number
  optionGrid?: string[]
  images?: string[]
  provider?: string
  offShelfAt?: string
  publishAt?: string
  createdAt?: string
  updatedAt?: string
  owner?: string
}

export type PublishProductInput = Pick<Product, 'id'>

export type PublishProductArgs = {
  input: PublishProductInput
}
