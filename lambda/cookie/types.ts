export type Cookie = {
  id: string
  name: string
  value: string
  path?: string
  domain?: string
  expires?: number
  samSite?: 'Strict' | 'Lax' | 'None'
  secure?: boolean
  [property: string]: any
  createdAt?: string
  updatedAt?: string
  owner: string
}

export type CookieConnection = {
  items: Cookie[]
  nextToken?: string
}

export type CreateCookieInput = Omit<Cookie, 'id' | 'owner'>

export type UpdateCookieInput = Partial<Omit<Cookie, 'id' | 'owner'>> &
  Pick<Cookie, 'id'>

export type DeleteCookieInput = Pick<Cookie, 'id'>

export type ListCookiesArgs = {
  limit?: number
  nextToken?: string
}

export type GetCookieArgs = Pick<Cookie, 'id'>

export type CreateCookieArgs = {
  input: CreateCookieInput
}

export type UpdateCookieArgs = {
  input: UpdateCookieInput
}

export type DeleteCookieArgs = {
  input: DeleteCookieInput
}
