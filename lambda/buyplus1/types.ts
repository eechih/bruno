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
  image?: ArrayBuffer // 系統首圖
  description?: string // 社群貼文內容
  fbGroupsId: string // 要貼文之社團
  statusDate?: string // 自動下架時間(格式: YYYY-MM-DD HH:mm)
  location?: string // 產地 (進貨廠商)
  option1?: string[] // 規格1
  option2?: string[] // 規格2
  createdAt?: string // 建立時間
  updatedAt?: string // 修改時間
  postedAt?: string // 發布貼文時間
  postedUrl?: string // 發布貼文URL
}

export type CreateBP1ProductInput = Omit<BP1Product, 'id'>
