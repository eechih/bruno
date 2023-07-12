import { automatorQueue, productTable, settingsTable } from '.'
import { Product, ProductPublishState } from '../product/types'
import { Settings } from '../settings/types'
import { Buyplus1 } from './buyplus1'

import { util } from '../../utils'

export type PublishProductParams = {
  productId: string
  owner: string
}

export const asyncPublishProduct = async (
  params: PublishProductParams
): Promise<Product> => {
  console.log('asyncPublishProduct', params)
  const { productId } = params
  await getProduct(productId)
  await automatorQueue.sendMessage({
    body: JSON.stringify(params),
  })
  return updatePublishState(productId, ProductPublishState.PENDING)
}

export default async function (params: PublishProductParams): Promise<Product> {
  console.log('Start publiching product...', params)
  const { productId, owner } = params
  try {
    await updatePublishState(productId, ProductPublishState.PPRCESSING)
    const product = await getProduct(productId)
    const settings = await getSettings(owner)
    const bp1 = new Buyplus1(settings.fbCookie, settings.bp1Cookie)
    await bp1.refreshToken()
    const bp1Id = await bp1.assignNewId()
    await updateBP1ProductId(productId, bp1Id)
    await bp1.updateProduct(bp1Id, product)
    const fbPostId = await bp1.postInFBGroup(bp1Id, product.fbGroupId)
    await updateFbPostId(productId, fbPostId)
    return updatePublishState(productId, ProductPublishState.PPRCESSED)
  } catch (error) {
    console.error('Failed to publish product.', error)
    await updatePublishState(productId, ProductPublishState.FAILED)
    throw new Error('Failed to publish product.')
  }
}

const getProduct = async (productId: string): Promise<Product> => {
  const product = await productTable.getItem<Product>({
    key: { id: productId },
  })
  if (!product) throw new Error('Product not found.')
  return product
}

const getSettings = async (owner: string): Promise<Settings> => {
  const settings = await settingsTable.getItem<Settings>({
    key: { owner },
  })
  if (!settings) throw new Error('Settings not found.')
  return settings
}

const updateBP1ProductId = async (
  productId: string,
  bp1Id: string
): Promise<Product> => {
  return productTable.updateItem<Product>({
    key: { id: productId },
    attributeValues: {
      bp1ProductId: bp1Id,
      bp1CreatedAt: util.time.nowISO8601(),
    },
  })
}

const updateFbPostId = async (
  productId: string,
  fbPostId: string
): Promise<Product> => {
  return productTable.updateItem<Product>({
    key: { id: productId },
    attributeValues: {
      fbPostId: fbPostId,
      fbPostedAt: util.time.nowISO8601(),
    },
  })
}

const updatePublishState = async (
  productId: string,
  publishState: ProductPublishState
): Promise<Product> => {
  return productTable.updateItem<Product>({
    key: { id: productId },
    attributeValues: {
      publishState,
    },
  })
}
