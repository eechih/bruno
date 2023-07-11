type ISO8601String = string

export type Settings = {
  owner: string
  profile?: Profile
  fbCookie?: FBCookie
  bp1Cookie?: BP1Cookie
  createdAt: ISO8601String
}

export type Profile = {
  name: string
  updatedAt: ISO8601String
}

export type FBCookie = {
  fr: string
  xs: string
  datr: string
  c_user: string
  wd: string
  sb: string
  updatedAt: ISO8601String
}

export type BP1Cookie = {
  currency: string
  __cf_bm: string
  __Secure_PHPSESSID: string
  updatedAt: ISO8601String
}

export type UpdateFBCookieInput = Omit<FBCookie, 'updatedAt'>

export type UpdateBP1CookieInput = Omit<BP1Cookie, 'updatedAt'>

export type UpdateFBCookieArgs = {
  input: UpdateFBCookieInput
}
export type UpdateBP1CookieArgs = {
  input: UpdateBP1CookieInput
}

export type ResolverEventArgs = UpdateFBCookieArgs | UpdateBP1CookieArgs

export type ResolverResults = Settings | Profile | FBCookie | BP1Cookie
