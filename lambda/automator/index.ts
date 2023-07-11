import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'

import S3Client from '../../libs/S3Client'
import DynamoDBDataClient from '../../libs/ddbDataClient'
import { Product } from '../product/types'
import postInFB from './postInFB'
import publishProduct from './publishProduct'
import { PublishProductArgs } from './types'

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  bucketName: process.env.BUCKET_NAME!,
})

export const settingsDataClient = new DynamoDBDataClient({
  region: process.env.AWS_REGION!,
  tableName: process.env.SETTINGS_TABLE_NAME!,
})

export const productDataClient = new DynamoDBDataClient({
  region: process.env.AWS_REGION!,
  tableName: process.env.PRODUCT_TABLE_NAME!,
})

export const handler = async (
  event: AppSyncResolverEvent<PublishProductArgs>
): Promise<Product | null> => {
  console.log('Received event {}', JSON.stringify(event, null, 3))

  const identity = event.identity as AppSyncIdentityCognito
  if (!identity) {
    throw new Error('Forbidden, missing identity information')
  }
  const { sub: owner } = identity
  const { fieldName } = event.info

  if (fieldName === 'publishProduct') {
    const { input } = event.arguments as PublishProductArgs
    return publishProduct(owner, input)
  } else if (fieldName === 'postInFB') {
    return postInFB()
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}
