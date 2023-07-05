import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'

import DynamoDBDataClient from '../../libs/ddbDataClient'
import { Product, PublishProductArgs } from './types'

const productDataClient = new DynamoDBDataClient({
  region: process.env.AWS_REGION!,
  tableName: process.env.PRODUCT_TABLE_NAME!,
})

export const handler = async (
  event: AppSyncResolverEvent<PublishProductArgs>
): Promise<Product> => {
  console.log('Received event {}', JSON.stringify(event, null, 3))

  const { fieldName } = event.info
  const identity = event.identity as AppSyncIdentityCognito

  if (!identity) throw new Error('Forbidden, missing identity information')

  const { sub: owner } = identity

  if (fieldName === 'publishProduct') {
    return publishProduct(event.arguments as PublishProductArgs, owner)
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}

export async function publishProduct(
  args: PublishProductArgs,
  owner: string
): Promise<Product> {
  console.log('publishProduct', args)
  const { input } = args
  const product = await productDataClient.getItem<Product>({
    key: { id: input.id },
  })
  if (!product) throw new Error('Product not found')
  return product
}
