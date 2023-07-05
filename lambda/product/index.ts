import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'

import DynamoDBDataClient from '../../libs/ddbDataClient'
import { util } from '../../utils'
import {
  CreateProductArgs,
  DeleteProductArgs,
  GetProductArgs,
  ListProductsArgs,
  Product,
  ProductConnection,
  UpdateProductArgs,
} from './types'

const productDataClient = new DynamoDBDataClient({
  region: process.env.AWS_REGION!,
  tableName: process.env.PRODUCT_TABLE_NAME!,
})

export const handler = async (
  event: AppSyncResolverEvent<
    | ListProductsArgs
    | GetProductArgs
    | CreateProductArgs
    | UpdateProductArgs
    | DeleteProductArgs
  >
): Promise<ProductConnection | Product> => {
  console.log('Received event {}', JSON.stringify(event, null, 3))

  const { fieldName } = event.info
  const identity = event.identity as AppSyncIdentityCognito

  if (!identity) throw new Error('Forbidden, missing identity information')

  const { sub: owner } = identity

  if (fieldName === 'listProducts') {
    return listProducts(event.arguments as ListProductsArgs, owner)
  } else if (fieldName === 'getProduct') {
    return getProduct(event.arguments as GetProductArgs, owner)
  } else if (fieldName === 'createProduct') {
    return createProduct(event.arguments as CreateProductArgs, owner)
  } else if (fieldName === 'updateProduct') {
    return updateProduct(event.arguments as UpdateProductArgs, owner)
  } else if (fieldName === 'deleteProduct') {
    return deleteProduct(event.arguments as DeleteProductArgs, owner)
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}

export async function listProducts(
  args: ListProductsArgs,
  owner: string
): Promise<ProductConnection> {
  console.log('listProducts', args)
  const connection = await productDataClient.query<Product>({
    query: {
      expression: '#owner = :owner',
      expressionNames: { '#owner': 'owner' },
      expressionValues: { ':owner': owner },
    },
    index: 'byOwner',
    limit: args.limit,
    nextToken: args.nextToken,
    scanIndexForward: false,
  })
  return connection
}

export async function getProduct(
  args: GetProductArgs,
  owner: string
): Promise<Product> {
  console.log('getProduct', args)
  const product = await productDataClient.getItem<Product>({
    key: { id: args.id },
  })
  if (!product) throw new Error('Product not found')
  return product
}

export async function createProduct(
  args: CreateProductArgs,
  owner: string
): Promise<Product> {
  console.log('createProduct', args)
  const { input } = args
  const created = await productDataClient.putItem<Product>({
    key: { id: util.autoId() },
    attributeValues: {
      ...input,
      createdAt: util.time.nowISO8601(),
      owner: owner,
    },
  })
  if (!created) throw new Error('Failed to create product')
  return created
}

export async function updateProduct(
  args: UpdateProductArgs,
  owner: string
): Promise<Product> {
  console.log('updateProduct', args)
  const { input } = args
  const updated = await productDataClient.updateItem<Product>({
    key: { id: input.id },
    attributeValues: {
      ...input,
      updatedAt: util.time.nowISO8601(),
    },
  })
  if (!updated) throw new Error('Failed to update product.')
  return updated
}

export async function deleteProduct(
  args: DeleteProductArgs,
  owner: string
): Promise<Product> {
  console.log('deleteProduct', args)
  const { input } = args
  const deleted = await productDataClient.deleteItem<Product>({
    key: { id: input.id },
  })
  if (!deleted) throw new Error('Failed to delete product')
  return deleted
}
