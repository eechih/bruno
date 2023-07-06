import axios, { Axios } from 'axios'
import * as cheerio from 'cheerio'
import FormData from 'form-data'
import { ClientRequest } from 'http'
import moment from 'moment'

import { isEmpty, isNil } from 'ramda'
import { util } from '../../utils'
import { BP1Product, Cookie, CreateBP1ProductInput } from './types'

export const endpoint =
  'https://s18.buyplus1.com.tw/b/1301023989915468/admin/index.php'

const userAgent =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'

export const createAxiosInstance = (params: { cookie: Cookie }): Axios => {
  return axios.create({
    baseURL: endpoint,
    headers: {
      'User-Agent': userAgent,
      Cookie: toCookieInHeaders(params.cookie),
    },
    withCredentials: true,
  })
}

export const toCookieInHeaders = (cookie: Cookie): string => {
  return cookie.map(({ name, value }) => `${name}=${value}`).join('; ')
}

export const getBuyplus1Token = async (
  axios: Axios
): Promise<string | null> => {
  console.log('getBuyplus1Token...')
  const response = await axios.get('/')
  const request: ClientRequest = response.request
  const url = `${request.protocol}//${request.host}${request.path}`
  const token = new URL(url).searchParams.get('token')
  return token
}

type CreateBP1ProductProps = {
  axios: Axios
  token: string
  input: CreateBP1ProductInput
}

export const createBP1Product = async (
  props: CreateBP1ProductProps
): Promise<BP1Product> => {
  console.log('Start creating new product in Buy+1.', props.input)
  const { axios, token, input } = props
  const createProductResponse = await axios.get(
    `?route=catalog/product/add&token=${token}`
  )
  const $ = cheerio.load(createProductResponse.data)
  const productId = $('input[type="hidden"][name="product_id"]').val()
  const microtime = $('input[type="hidden"][name="microtime"]').val()
  const dateModified = $('input[type="hidden"][name="date_modified"]').val()
  const temporaryName = moment().unix()

  const formData = new FormData()
  formData.append('product_id', productId)
  formData.append('microtime', microtime)
  formData.append('date_modified', dateModified)
  formData.append('product_description[1][name]', temporaryName)
  formData.append('price', 0)
  await axios.post(
    `?route=catalog/product/saveProduct&token=${token}`,
    formData
  )

  const listProductsResponse = await axios.get(
    `?route=catalog/product&token=${token}&sort=p.product_id&order=DESC&filter_name=${temporaryName}`
  )
  const $2 = cheerio.load(listProductsResponse.data)
  const newId = $2('input[type="checkbox"].productSelected').val() as string

  if (!newId) {
    console.error(
      'failed to create product.',
      listProductsResponse.status,
      listProductsResponse.data
    )
    throw new Error('Failed to create product.')
  }

  console.log('Successfully created a product in Buy+1.')
  return { ...input, id: newId, createdAt: util.time.nowISO8601() }
}

export const updateBP1Product = async (props: {
  axios: Axios
  token: string
  product: BP1Product
}): Promise<BP1Product> => {
  console.log('Start updating product in Buy+1.', props.product)
  const { axios, token, product } = props
  const {
    id,
    name,
    price,
    cost = 0,
    description = '',
    status = 1,
    statusDate,
    location = '',
  } = product
  try {
    const res = await axios.get(
      `?route=catalog/product/edit&product_id=${id}&token=${token}`
    )
    const $ = cheerio.load(res.data)
    const microtime = $('input[type="hidden"][name="microtime"]').val()
    const dateModified = $('input[type="hidden"][name="date_modified"]').val()

    const replacedName = name.replace('{{product-id}}', `S1-${id}`)
    const updatedDescription = description?.replace(
      '{{product-id}}',
      `S1-${id}`
    )
    const form = new FormData()
    form.append('product_id', id)
    form.append('microtime', microtime ?? '')
    form.append('date_modified', dateModified ?? '')
    form.append('product_description[1][name]', replacedName)
    form.append('price', price)
    form.append('cost', cost)
    form.append('quantity', 0)
    form.append('status', status)
    form.append('image', '')
    form.append('product_description[1][description]', updatedDescription)
    form.append('fb_groups_id', '913862951959460')
    form.append(
      'product_status_date',
      moment(statusDate).format('YYYY-MM-DD HH:mm')
    )
    form.append('location', location)
    form.append('shipping', 1)
    form.append('allow_import', 1)
    form.append('type', 1)
    form.append('product_store[]', 0)
    form.append('minimum', 1)
    form.append('subtract', 1)

    const saveProductResp = await axios.post(
      `?route=catalog/product/saveProduct&token=${token}`,
      form
    )

    if (!saveProductResp.data.success) throw new Error(saveProductResp.data)

    // if (data.option)
    //   await this.saveProductOption({ productOption: data.option })

    // if (data.images)
    //   await this.updateProductImage({ imageUrl: data.images[0] })

    console.log('Successfully updated a product in Buy+1.')
    return { ...product, updatedAt: util.time.nowISO8601() }
  } catch (err) {
    console.error('failed to update product.', err)
    throw new Error('Failed to update product.')
  }
}

export const postInFBGroup = async (props: {
  axios: Axios
  token: string
  product: BP1Product
}): Promise<BP1Product> => {
  const { axios, token, product } = props
  console.log('Start posting to FB Group.', { product })

  const res = await axios.get(
    `?route=catalog/product/postInFBGroup&token=${token}&product_id=${product.id}&fb_group_id=${product.fbGroupsId}`
  )

  const status = res.data?.[0]?.status ?? ''
  const HREF_REGEX = /(href=")(.*)(">).*/
  const mo = status.match(HREF_REGEX)
  const url = mo && mo[2]

  if (isNil(url) || isEmpty(url)) {
    throw new Error(`Failed to post to FB Group. Reason: ${res.data}`)
  }

  console.log('Successfully post to FB Group.')
  return { ...product, postedAt: util.time.nowISO8601(), postedUrl: url }
}
