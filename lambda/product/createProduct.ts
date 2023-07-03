import { PutCommand } from '@aws-sdk/lib-dynamodb'

import { ddbDocClient } from '../libs/ddbClient'
import { util } from '../libs/utils'
import { CreateProductArgs, Product } from './types'

export default async function (args: CreateProductArgs): Promise<Product> {
  console.log('createProduct', args)
  const product: Product = {
    ...args.input,
    id: util.autoId(),
    createdAt: 'createAt',
    owner: 'owner',
  }
  const command = new PutCommand({
    TableName: process.env.PRODUCT_TABLE_NAME,
    Item: product,
  })
  const response = await ddbDocClient.send(command)
  if (!response.Attributes) throw new Error('Failed to create product')
  return response.Attributes as Product
}
