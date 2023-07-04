import { ddbDocClient } from '../../libs/ddbClient'
import { util } from '../../utils'
import { Product, UpdateProductInput } from './types'

const tableName = process.env.PRODUCT_TABLE_NAME!

export default async function updateProduct(
  input: UpdateProductInput
): Promise<Product> {
  console.log('updateProduct', input)
  const key = { id: input.id }
  const attributes = { ...input, updatedAt: util.time.nowISO8601() }
  const command = util.toUpdateCommand(tableName, key, attributes)
  const response = await ddbDocClient.send(command)
  if (!response.Attributes) throw new Error('Failed to update product.')
  return response.Attributes as Product
}
