export type ProductConnection = {
  items: Pick<Product, 'id'>[]
  nextToken?: string
}

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

export type CreateProductInput = Pick<
  Product,
  | 'name'
  | 'description'
  | 'price'
  | 'cost'
  | 'optionGrid'
  | 'images'
  | 'provider'
  | 'offShelfAt'
>

export type UpdateProductInput = Pick<Product, 'id'> &
  Partial<
    Pick<
      Product,
      | 'name'
      | 'description'
      | 'price'
      | 'cost'
      | 'optionGrid'
      | 'images'
      | 'provider'
      | 'offShelfAt'
    >
  >

export type DeleteProductInput = Pick<Product, 'id'>

export type PublishProductInput = Pick<Product, 'id'>

export type ListProductsArgs = {
  limit?: number
  nextToken?: string
}

export type GetProductArgs = Pick<Product, 'id'>

export type CreateProductArgs = {
  input: CreateProductInput
}

export type UpdateProductArgs = {
  input: UpdateProductInput
}

export type DeleteProductArgs = {
  input: DeleteProductInput
}

export type PublishProductArgs = {
  input: PublishProductInput
}
