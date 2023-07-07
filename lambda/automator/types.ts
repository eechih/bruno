export * from '../product/types'

export type BP1Product = {
  id: string // 編號
  name: string // 商品名稱
  price: number // 價格
  cost?: number // 成本
  quantity?: number // 數量
  status?: 0 | 1 // 狀態 (0: 已下架, 1: 上架中)
  images?: ArrayBuffer[] // 圖片
  options?: string[][] // 規格
  statusDate?: string // 自動下架時間(格式: YYYY-MM-DD HH:mm)
  location?: string // 產地 (進貨廠商)
  fbMessage?: string // 社群貼文內容
  fbGroupId: string // 要貼文之社團
  fbPostId?: string // FB貼文ID
  fbPostedAt?: string // FB貼文時間
  createdAt?: string // 建立時間
  updatedAt?: string // 修改時間
}

export type CreateBP1ProductInput = Omit<BP1Product, 'id'>

export type PostToFBArgs = {
  productId: string
  fbGroupId: string
}
