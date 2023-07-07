export * from '../product/types'

export type Cookie = {
  name: string
  value: string
  path?: string
  domain?: string
  expires?: number
  samSite?: 'Strict' | 'Lax' | 'None'
  secure?: boolean
  [property: string]: any
}[]

export type BP1Product = {
  id: string // 編號
  name: string // 商品名稱
  price: number // 價格
  cost?: number // 成本
  quantity?: number // 數量
  status?: 0 | 1 // 狀態 (0: 已下架, 1: 上架中)
  images?: ArrayBuffer[] // 圖片
  description?: string // 社群貼文內容
  fbGroupId: string // 要貼文之社團
  statusDate?: string // 自動下架時間(格式: YYYY-MM-DD HH:mm)
  location?: string // 產地 (進貨廠商)
  options?: string[][] // 規格
  createdAt?: string // 建立時間
  updatedAt?: string // 修改時間
  fbPostId?: string // FB貼文ID
  fbPostedAt?: string // FB貼文時間
}

export type CreateBP1ProductInput = Omit<BP1Product, 'id'>
