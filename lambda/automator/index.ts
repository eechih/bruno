import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'

import S3Client from '../../libs/S3Client'
import DynamoDBDataClient from '../../libs/ddbDataClient'
import { Product } from '../product/types'
import { Settings } from '../settings/types'
import { Buyplus1 } from './buyplus1'
import { PostToFBArgs, PublishProductArgs } from './types'

const region = process.env.AWS_REGION!
const bucketName = process.env.BUCKET_NAME!
const settingsTableName = process.env.SETTINGS_TABLE_NAME!
const productTableName = process.env.PRODUCT_TABLE_NAME!

export const s3Client = new S3Client({ region, bucketName })
const settingsDataClient = new DynamoDBDataClient({
  region,
  tableName: settingsTableName,
})
const productDataClient = new DynamoDBDataClient({
  region,
  tableName: productTableName,
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

export async function postToFB(
  args: PostToFBArgs,
  owner: string
): Promise<string> {
  const { fbGroupId, productId } = args
  const product = await productDataClient.getItem<Product>({
    key: { id: productId },
  })
  if (!product) {
    throw new Error('Product not found')
  }

  return ''
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
  if (!product) {
    throw new Error('Product not found')
  }
  console.log('product', product)

  const settings = await settingsDataClient.getItem<Settings>({
    key: { owner: owner },
  })
  if (!settings) {
    throw new Error('Settings not found')
  }

  const imageUrl = await s3Client.getPresignedUrl({ key: 'test' })
  console.log('imageUrl', imageUrl)

  const bp1 = new Buyplus1(settings.fbCookie, settings.bp1Cookie)

  await bp1.publish(product)

  return product
}
