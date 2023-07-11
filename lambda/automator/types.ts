export * from '../product/types'

export type PostToFBArgs = {
  productId: string
  fbGroupId: string
}

export type FBCookie = {
  fr: string
  xs: string
  datr: string
  c_user: string
  wd: string
  sb: string
}

export type BP1Cookie = {
  currency: string
  __cf_bm: string
  __Secure_PHPSESSID: string
}

export type Cookie = {
  name: string
  value: string
}
