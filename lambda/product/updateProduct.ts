import { ddbDocClient } from '../libs/ddbClient'
import { util } from '../libs/utils'
import { Product, UpdateProductInput } from './types'
import { toUpdateCommand } from './util'

const tableName = process.env.PRODUCT_TABLE_NAME!

export default async function updateProduct(
  input: UpdateProductInput
): Promise<Product> {
  console.log('updateProduct', input)
  const key = { id: input.id }
  const attributes = { ...input, updatedAt: util.time.nowISO8601() }
  const command = toUpdateCommand(tableName, key, attributes)
  const response = await ddbDocClient.send(command)
  if (!response.Attributes) throw new Error('Failed to update product.')
  return response.Attributes as Product
}
