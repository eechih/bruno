import { GetCommand } from '@aws-sdk/lib-dynamodb'

import { ddbDocClient } from '../../libs/ddbClient'
import { Product } from './types'

interface GetProductParams {
  id: string
  owner: string
}

export default async function getProduct(
  params: GetProductParams
): Promise<Product> {
  console.log('getProduct', params)
  const { id } = params
  const command = new GetCommand({
    TableName: process.env.PRODUCT_TABLE_NAME,
    Key: { id },
  })

  const response = await ddbDocClient.send(command)
  if (!response.Item) throw new Error('Product not found.')
  return response.Item as Product
}
