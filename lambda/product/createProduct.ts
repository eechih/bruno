import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb'

import { ddbDocClient } from '../../libs/ddbClient'
import { util } from '../../utils'
import { CreateProductInput, Product } from './types'

interface CreateProductParams {
  input: CreateProductInput
  owner: string
}

export default async function createProduct({
  input,
  owner,
}: CreateProductParams): Promise<Product> {
  console.log('createProduct', input)

  const newItem: Record<string, NativeAttributeValue> = {
    ...input,
    id: util.autoId(),
    createdAt: util.time.nowISO8601(),
    owner: owner,
  }

  const command = new PutCommand({
    TableName: process.env.PRODUCT_TABLE_NAME,
    Item: newItem,
  })
  try {
    const response = await ddbDocClient.send(command)
    console.log('response', response)
    const { Attributes: created } = response
    if (!created) throw new Error('Failed to create product')
    return created as Product
  } catch (error) {
    console.log('Error', error)
    throw error
  }
}
