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

export type ProductConnection = {
  items: Pick<Product, 'id'>[]
  nextToken?: string
}

export type GetProductArgs = Pick<Product, 'id'>

export type ListProductsArgs = {
  limit?: number
  nextToken?: string
}

export type ListProductsResult = ProductConnection

export type CreateProductArgs = {
  input: Pick<
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
}

export type UpdateProductArgs = {
  input: Pick<Product, 'id'> &
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
}

export type DeleteProductArgs = {
  input: Pick<Product, 'id'>
}

export type PublishProductArgs = {
  input: Pick<Product, 'id'>
}
