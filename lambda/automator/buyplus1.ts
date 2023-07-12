import { Axios } from 'axios'
import * as cheerio from 'cheerio'
import FormData from 'form-data'
import { ClientRequest } from 'http'
import moment from 'moment'
import { isEmpty, isNil } from 'ramda'

import { s3 } from '.'
import { BP1Cookie, FBCookie } from '../settings/types'
import { Product } from './types'
import { convertBP1Cookie, convertFBCookie, createAxiosInstance } from './util'

type BPFile = {
  mime: string
  hash: string
  name: string
}

export class Buyplus1 {
  private axios: Axios
  private token: string

  constructor(fbCookie?: FBCookie, bp1Cookie?: BP1Cookie) {
    this.axios = createAxiosInstance({
      baseURL: 'https://s18.buyplus1.com.tw/b/1301023989915468/admin/index.php',
      cookies: [...convertFBCookie(fbCookie), ...convertBP1Cookie(bp1Cookie)],
    })
  }

  refreshToken = async () => {
    console.log('refreshToken...')
    const response = await this.axios.get('/')
    const request: ClientRequest = response.request
    const url = `${request.protocol}//${request.host}${request.path}`
    const token = new URL(url).searchParams.get('token')
    if (!token) throw new Error('Failed to get token from Buyplus1')
    console.log('token', token)
    this.token = token
  }

  assignNewId = async (): Promise<string> => {
    console.log('Start assigning new Buy+1 product ID...')
    const createProductResponse = await this.axios.get(
      `?route=catalog/product/add&token=${this.token}`
    )
    const $ = cheerio.load(createProductResponse.data)
    const bp1Id = $('input[type="hidden"][name="product_id"]').val()
    const microtime = $('input[type="hidden"][name="microtime"]').val()
    const dateModified = $('input[type="hidden"][name="date_modified"]').val()
    const temporaryName = moment().unix()

    const formData = new FormData()
    formData.append('product_id', bp1Id)
    formData.append('microtime', microtime)
    formData.append('date_modified', dateModified)
    formData.append('product_description[1][name]', temporaryName)
    formData.append('price', 0)
    await this.axios.post(
      `?route=catalog/product/saveProduct&token=${this.token}`,
      formData
    )

    const listProductsResponse = await this.axios.get(
      `?route=catalog/product&token=${this.token}&sort=p.product_id&order=DESC&filter_name=${temporaryName}`
    )
    const $2 = cheerio.load(listProductsResponse.data)
    const newId = $2('input[type="checkbox"].productSelected').val() as string

    if (!newId) {
      console.error(
        'Failed to assign new Buy+1 product ID.',
        listProductsResponse.status,
        listProductsResponse.data
      )
      throw new Error('Failed to assign new Buy+1 product ID.')
    }

    console.log('Successfully assigned new Buy+1 product ID')
    return newId
  }

  updateProduct = async (
    bp1Id: string,
    input: Pick<
      Product,
      | 'name'
      | 'price'
      | 'cost'
      | 'fbMessage'
      | 'offShelfAt'
      | 'provider'
      | 'options'
      | 'images'
    >
  ) => {
    console.log('Start updating product in Buy+1.', bp1Id, input)
    const {
      name,
      price,
      cost = 0,
      fbMessage = '',
      offShelfAt,
      provider = '',
      options,
      images,
    } = input
    try {
      const res = await this.axios.get(
        `?route=catalog/product/edit&product_id=${bp1Id}&token=${this.token}`
      )
      const $ = cheerio.load(res.data)
      const microtime = $('input[type="hidden"][name="microtime"]').val()
      const dateModified = $('input[type="hidden"][name="date_modified"]').val()

      const replacedName = name.replace('{{product-id}}', `S1-${bp1Id}`)
      const description = fbMessage?.replace('{{product-id}}', `S1-${bp1Id}`)
      const form = new FormData()
      form.append('product_id', bp1Id)
      form.append('microtime', microtime ?? '')
      form.append('date_modified', dateModified ?? '')
      form.append('product_description[1][name]', replacedName)
      form.append('price', price)
      form.append('cost', cost)
      form.append('quantity', 0)
      form.append('status', 1)
      form.append('image', '')
      form.append('product_description[1][description]', description)
      form.append('fb_groups_id', '913862951959460')
      form.append(
        'product_status_date',
        moment(offShelfAt).format('YYYY-MM-DD HH:mm')
      )
      form.append('location', provider)
      form.append('shipping', 1)
      form.append('allow_import', 1)
      form.append('type', 1)
      form.append('product_store[]', 0)
      form.append('minimum', 1)
      form.append('subtract', 1)

      const saveProductResp = await this.axios.post(
        `?route=catalog/product/saveProduct&token=${this.token}`,
        form
      )

      if (!saveProductResp.data.success) throw new Error(saveProductResp.data)

      if (options) await this.saveProductOption(bp1Id, options)
      if (images) await this.updateProductImage(bp1Id, images[0])
      console.log('Successfully updated a product in Buy+1.')
    } catch (err) {
      console.error('failed to update product.', err)
      throw new Error('Failed to update product.')
    }
  }

  postInFBGroup = async (bp1Id: string, fbGroupId: string): Promise<string> => {
    console.log('Start posting to FB Group.', { bp1Id, fbGroupId })

    const res = await this.axios.get(
      `?route=catalog/product/postInFBGroup&token=${this.token}&product_id=${bp1Id}&fb_group_id=${fbGroupId}`
    )

    const status = res.data?.[0]?.status ?? ''
    const HREF_REGEX = /(href=")(.*)(">).*/
    const mo = status.match(HREF_REGEX)
    const url = mo && mo[2]

    if (isNil(url) || isEmpty(url)) {
      console.log('Failed to post to FB Group', res.data)
      throw new Error(
        `Failed to post to FB Group. Reason: ${JSON.stringify(res.data)}`
      )
    }

    const fbPostId = url.replace('https://www.facebook.com/', '')
    console.log('Successfully post to FB Group.', fbPostId)
    return fbPostId
  }

  private updateProductImage = async (bp1Id: string, imageKey: string) => {
    console.log('updateProductImage', { bp1Id, imageKey })
    // get image url
    const imageUrl = await s3.getPresignedUrl({ key: imageKey })
    // download image
    console.log('Download image...', imageUrl)
    const response1 = await this.axios.get(imageUrl, {
      decompress: false,
      responseType: 'arraybuffer',
    })
    const imageData = response1.data
    console.log('Image download successful.')

    // get image dir
    const imageDir = await this.obtaineImageDir({
      dirName: bp1Id,
    })
    console.log('ImageDir', imageDir)

    // upload image
    console.log('Upload image...')
    const formData = new FormData()
    formData.append('cmd', 'upload')
    formData.append('target', imageDir.hash)
    formData.append('upload[]', imageData, `${Date.now()}.jpg`)
    const response2 = await this.axios.postForm(
      `?route=common/filemanager/connector&token=${this.token}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    console.log('Image upload response:', response2)
    const image = response2.data?.added?.[0]
    console.log('Image upload successful.', image)

    // update the image of product
    await this.quickUpdate({
      id: `image-${bp1Id}`,
      new: `catalog/upload/${bp1Id}/${image.name}`,
    })
  }

  private obtaineImageDir = async (props: {
    dirName: string
  }): Promise<BPFile> => {
    console.log('obtaineImageDir', props)
    const { dirName } = props
    const res = await this.axios.get(
      `?route=common/filemanager/connector&token=${this.token}&cmd=open&target=l1_dXBsb2Fk&_=1676342825551`
    )
    const files: BPFile[] = res.data.files
    const maybeDir = files.find(
      f => f.mime === 'directory' && f.name === dirName
    )
    if (maybeDir) return maybeDir
    else return await this.createImageDir({ dirName })
  }

  private createImageDir = async (props: {
    dirName: string
  }): Promise<BPFile> => {
    console.log('createImageDir', props)
    const { dirName } = props
    const url =
      `?route=common/filemanager/connector&token=${this.token}` +
      `&cmd=mkdir&name=${dirName}&target=l1_dXBsb2Fk&_=${moment().valueOf()}}`
    const response = await this.axios.get(url)
    return response.data?.added?.[0]
  }

  private quickUpdate = async (props: {
    id: string
    old?: string
    new: string
  }) => {
    console.log('quickUpdate', props)
    const form = new FormData()
    form.append('id', props.id)
    form.append('old', props.old ?? '')
    form.append('new', props.new)
    form.append('lang_id', '1')
    const res = await this.axios.post(
      `?route=catalog/product/quick_update&token=${this.token}`,
      form
    )
    if (res?.data?.success === 1) console.log('Update completed.')
    else console.log('Update failed:', res?.data)
  }

  private saveProductOption = async (bp1Id: string, options: string[][]) => {
    console.log('saveOptions', bp1Id, options)
    const form = new FormData()
    form.append('p_id', bp1Id)
    form.append('microtime', '')
    for (let i = 0; i < options.length; i++) {
      form.append(`product_option[${i}][name]`, '手動輸入')
      form.append(`product_option[${i}][option_id]`, '1')
      form.append(`product_option[${i}][type]`, 'select')
      form.append(`product_option[${i}][required]`, '1')
      form.append(`product_option[${i}][product_option_value]`, '')
    }
    const url = `?route=catalog/product_ext/saveProductOption&token=${this.token}&batch_edit=1&selected=`
    await this.axios.post(url, form)

    for (let i = 0; i < options.length; i++) {
      const option = options[i]
      const form = new FormData()
      form.append('batch_edit', '1')
      form.append('selected', '')
      form.append('product_id', bp1Id)
      form.append('microtime', '')
      form.append('table_index', i)
      form.append('options_count', options.length)
      form.append('options_index', i + 1)
      form.append('option_tr_count', option.length)
      form.append('option_tr_index', option.length)
      for (let i = 0; i < option.length; i++) {
        form.append(`options[${i}][subtract]`, 1)
        form.append(`options[${i}][price_prefix]`, '+')
        form.append(`options[${i}][cost_prefix]`, '+')
        form.append(`options[${i}][option_value_name]`, option[i])
        form.append(`options[${i}][product_option_value_id]`, '')
        form.append(`options[${i}][alias]`, '')
        form.append(`options[${i}][quantity]`, '0')
        form.append(`options[${i}][price]`, '0')
        form.append(`options[${i}][points_prefix]`, '')
        form.append(`options[${i}][points]`, '0')
        form.append(`options[${i}][weight_prefix]`, '')
        form.append(`options[${i}][weight]`, '0.00000000')
        form.append(`options[${i}][cost]`, '0')
      }
      const url = `?route=catalog/product_ext/saveProductOptionValue&token=${this.token}`
      const res = await this.axios.post(url, form)
      if (res?.data?.error) console.log('Save failed:', res?.data)
    }
  }
}
