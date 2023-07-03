import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb'
import { isEmpty } from 'ramda'

import { ddbDocClient } from '../libs/ddbClient'
import { Product, UpdateProductArgs } from './types'

export default async function (args: UpdateProductArgs): Promise<Product> {
  console.log('updateProduct', args)

  const expressions: string[] = []
  const attributeValues: Record<string, NativeAttributeValue> = {}

  if (args.input.name) {
    expressions.push('name = :name')
    attributeValues[':name'] = args.input.name
  }

  if (args.input.description) {
    expressions.push('description = :description')
    attributeValues[':description'] = args.input.description
  }

  if (args.input.price) {
    expressions.push('price = :price')
    attributeValues[':price'] = args.input.price
  }

  if (args.input.cost) {
    expressions.push('cost = :cost')
    attributeValues[':cost'] = args.input.cost
  }

  if (args.input.images) {
    expressions.push('images = :images')
    attributeValues[':images'] = args.input.images
  }

  if (args.input.provider) {
    expressions.push('provider = :provider')
    attributeValues[':provider'] = args.input.provider
  }

  if (args.input.offShelfAt) {
    expressions.push('offShelfAt = :offShelfAt')
    attributeValues[':offShelfAt'] = args.input.offShelfAt
  }

  const command = new UpdateCommand({
    TableName: process.env.PRODUCT_TABLE_NAME,
    Key: { id: args.input.id },
    UpdateExpression: !isEmpty(expressions)
      ? `set ${expressions.join(', ')}`
      : undefined,
    ExpressionAttributeValues: attributeValues,
    ReturnValues: 'ALL_NEW',
  })

  console.log('command', command)

  const response = await ddbDocClient.send(command)
  if (!response.Attributes) throw new Error('Failed to update product.')
  return response.Attributes as Product
}
