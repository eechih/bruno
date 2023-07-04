import { GetCommand } from '@aws-sdk/lib-dynamodb'

import { ddbDocClient } from '../libs/ddbClient'
import { Product } from './types'

export default async function getProduct(args: {
  id: string
}): Promise<Product> {
  console.log('getProduct', args)
  const command = new GetCommand({
    TableName: process.env.PRODUCT_TABLE_NAME,
    Key: { id: args.id },
  })

  const response = await ddbDocClient.send(command)
  if (!response.Item) throw new Error('Product not found.')
  return response.Item as Product
}
