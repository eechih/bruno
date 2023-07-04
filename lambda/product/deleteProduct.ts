import { DeleteCommand } from '@aws-sdk/lib-dynamodb'

import { ddbDocClient } from '../../libs/ddbClient'
import { DeleteProductInput, Product } from './types'

interface DeleteProductParams {
  input: DeleteProductInput
  owner: string
}

export default async function deleteProduct({
  input,
  owner,
}: DeleteProductParams): Promise<Product> {
  console.log('deleteProduct', input)

  const command = new DeleteCommand({
    TableName: process.env.PRODUCT_TABLE_NAME,
    Key: { id: input.id },
  })
  const response = await ddbDocClient.send(command)
  if (!response.Attributes) throw new Error('Cloud not delete product.')
  return response.Attributes as Product
}
