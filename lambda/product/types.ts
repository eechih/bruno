export type ISO8601String = string

export type ProductConnection = {
  items: Pick<Product, 'id'>[]
  nextToken?: string
}

export type Product = {
  id: string // 商品ID
  name: string // 商品名稱
  description?: string // 商品描述
  price?: number // 價格
  cost?: number // 成本
  options?: string[][] // 規格
  images?: string[] // 圖片 URLs
  provider?: string // 產地 (進貨廠商)
  offShelfAt?: ISO8601String // 自動下架時間
  fbMessage?: string // 社群貼文內容
  fbGroupId: string // 要貼文之社團
  fbPostId?: string // FB貼文ID
  fbPostedAt?: ISO8601String // FB貼文時間
  bp1ProductId?: string // Buy+1 ID
  bp1CreatedAt?: ISO8601String // Buy+1產品編號
  createdAt?: ISO8601String
  updatedAt?: ISO8601String
  owner: string
}

export type CreateProductInput = Pick<
  Product,
  | 'name'
  | 'description'
  | 'price'
  | 'cost'
  | 'options'
  | 'images'
  | 'provider'
  | 'offShelfAt'
  | 'fbMessage'
  | 'fbGroupId'
>

export type UpdateProductInput = Pick<Product, 'id'> &
  Partial<
    Pick<
      Product,
      | 'name'
      | 'description'
      | 'price'
      | 'cost'
      | 'options'
      | 'images'
      | 'provider'
      | 'offShelfAt'
      | 'fbMessage'
      | 'fbGroupId'
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
