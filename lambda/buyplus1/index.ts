import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'
import { isEmpty, isNil } from 'ramda'

import DynamoDBDataClient from '../../libs/dynamodb/Client'
import S3Client from '../../libs/s3/Client'
import {
  Cookie,
  CreateBP1ProductInput,
  Product,
  PublishProductArgs,
} from './types'
import * as util from './util'

const region = process.env.AWS_REGION!
const tableName = process.env.PRODUCT_TABLE_NAME!
const bucketName = process.env.BUCKET_NAME!

const productDataClient = new DynamoDBDataClient({ region, tableName })
const s3Client = new S3Client({ region, bucketName })

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
  if (!product) {
    throw new Error('Product not found')
  }

  const objKey = 'private/cookie/facebook/100000236390565.json'
  const objData = await s3Client.getObject({ key: objKey })
  const cookie = JSON.parse(objData) as Cookie
  if (isNil(cookie) || isEmpty(cookie)) {
    throw new Error(`Failed to download buyplus1 cookie from S3 ${objKey}`)
  }
  console.log('cookie', cookie)

  const axios = util.createAxiosInstance({ cookie })

  const token = await util.getBuyplus1Token(axios)
  if (!token) {
    throw new Error(`Failed to get buyplus1's token`)
  }
  console.log('token', token)

  const createBP1ProductInput: CreateBP1ProductInput = {
    name: 'test2 by harry',
    price: 999,
    description: 'test test test',
    fbGroupId: '384011198690249',
  }

  const createdProduct = await util.createBP1Product({
    axios,
    token,
    input: createBP1ProductInput,
  })

  console.log('Created product', createdProduct)

  const updatedProduct = await util.updateBP1Product({
    axios,
    token,
    product: createdProduct,
  })

  console.log('Updated product', updatedProduct)

  const postedProduct = await util.postInFBGroup({
    axios,
    token,
    product: updatedProduct,
  })
  console.log('Posted porduct', postedProduct)

  return product
}
