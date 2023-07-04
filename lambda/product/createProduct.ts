import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb'

import { ddbDocClient } from '../libs/ddbClient'
import { util } from '../libs/utils'
import { CreateProductInput, Product } from './types'

export default async function createProduct(
  input: CreateProductInput
): Promise<Product> {
  console.log('createProduct', input)

  const newItem: Record<string, NativeAttributeValue> = {
    ...input,
    id: util.autoId(),
    createdAt: util.time.nowISO8601(),
    owner: '',
  }

  const command = new PutCommand({
    TableName: process.env.PRODUCT_TABLE_NAME,
    Item: newItem,
  })
  const response = await ddbDocClient.send(command)
  if (!response.Attributes) throw new Error('Failed to create product')
  return response.Attributes as Product
}
