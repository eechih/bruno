import axios, { Axios } from 'axios'

import { BP1Cookie, Cookie, FBCookie } from './types'

const userAgent =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

export const createAxiosInstance = (params: {
  baseURL: string
  cookies: Cookie[]
}): Axios => {
  return axios.create({
    baseURL: params.baseURL,
    headers: {
      'User-Agent': userAgent,
      Cookie: toCookieInHeaders(params.cookies),
    },
    withCredentials: true,
  })
}

export const toCookieInHeaders = (cookies: Cookie[]): string => {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
}

export const convertFBCookie = (cookie?: FBCookie): Cookie[] => {
  const cookies: Cookie[] = []
  if (cookie) {
    cookies.push({ name: 'fr', value: cookie.fr })
    cookies.push({ name: 'xs', value: cookie.xs })
    cookies.push({ name: 'datr', value: cookie.datr })
    cookies.push({ name: 'c_user', value: cookie.c_user })
    cookies.push({ name: 'wd', value: cookie.wd })
    cookies.push({ name: 'sb', value: cookie.sb })
  }
  return cookies
}

export const convertBP1Cookie = (cookie?: BP1Cookie): Cookie[] => {
  const cookies: Cookie[] = []
  if (cookie) {
    cookies.push({ name: 'currency', value: cookie.currency })
    cookies.push({ name: '__cf_bm', value: cookie.__cf_bm })
    cookies.push({
      name: '__Secure-PHPSESSID',
      value: cookie.__Secure_PHPSESSID,
    })
  }
  return cookies
}
