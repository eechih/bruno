import { DeleteCommand } from '@aws-sdk/lib-dynamodb'

import { ddbDocClient } from '../libs/ddbClient'
import { DeleteProductArgs, Product } from './types'

export default async function (args: DeleteProductArgs): Promise<Product> {
  console.log('deleteProduct', args)
  const command = new DeleteCommand({
    TableName: process.env.PRODUCT_TABLE_NAME,
    Key: { id: args.input.id },
  })
  const response = await ddbDocClient.send(command)
  if (!response.Attributes) throw new Error('Cloud not delete product.')
  return response.Attributes as Product
}
