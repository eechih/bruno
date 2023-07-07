import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'

import S3Client from '../../libs/S3Client'
import DynamoDBDataClient from '../../libs/ddbDataClient'
import { Cookie } from '../cookie/types'
import { Product } from '../product/types'
import {
  CreateBP1ProductInput,
  PostToFBArgs,
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

  // postInFB (axios, fbGroupId, name, price, description, options, statusDate, images)
  // importInBuyPlus1 (axios, token, fbGroupId, fbPostId, name, price, options, images)
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

  const cookies: Cookie[] = []

  const axios = util.createAxiosInstance({ cookies })

  const token = await util.getBuyplus1Token(axios)
  if (!token) {
    throw new Error(`Failed to get buyplus1's token`)
  }
  console.log('token', token)

  const createBP1ProductInput: CreateBP1ProductInput = {
    name: 'test2 by harry',
    price: 999,
    fbMessage: 'test test test',
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
