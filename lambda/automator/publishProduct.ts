import { productDataClient, settingsDataClient } from '.'
import { Product } from '../product/types'
import { Settings } from '../settings/types'
import { Buyplus1 } from './buyplus1'
import { PublishProductInput } from './types'

export default async function (
  owner: string,
  input: PublishProductInput
): Promise<Product> {
  console.log('publishProduct', input)
  const { id } = input

  const product = await productDataClient.getItem<Product>({
    key: { id },
  })
  if (!product) {
    throw new Error('Product not found')
  }
  console.log('product', product)

  const settings = await settingsDataClient.getItem<Settings>({
    key: { owner },
  })
  if (!settings) {
    throw new Error('Settings not found')
  }

  const buyplus1 = new Buyplus1(settings.fbCookie, settings.bp1Cookie)
  await buyplus1.publish(product)
  return product
}
