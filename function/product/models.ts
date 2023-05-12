/**
 * ISO 8601 is an international standard date and time format.
 * - Date: 2023-04-28
 * - Date and time: 2023-04-28T12:00:00
 * - Date and time in UTC: 2023-04-28T12:00:00Z
 * - Date and time with Time_zone: 2023-04-28T12:00:00+08:00
 */
export type ISO8601 = string

interface Product {
  id: string
  name: string
  description?: string
  price?: number
  cost?: number
  optionGrid?: string[][]
  images?: string[]
  provider?: string
  offShelfAt?: ISO8601
  publishAt?: ISO8601
  createdAt?: ISO8601
  updatedAt?: ISO8601
  _deleted?: boolean
  owner?: string
}

export { Product }
