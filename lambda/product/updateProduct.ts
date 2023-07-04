import { ddbDocClient } from '../../libs/ddbClient'
import { util } from '../../utils'
import { Product, UpdateProductInput } from './types'

const tableName = process.env.PRODUCT_TABLE_NAME!

interface UpdateProductParams {
  input: UpdateProductInput
  owner: string
}

export default async function updateProduct({
  input,
  owner,
}: UpdateProductParams): Promise<Product> {
  console.log('updateProduct', input)
  const key = { id: input.id }
  const attributes = { ...input, updatedAt: util.time.nowISO8601() }
  const command = util.toUpdateCommand(tableName, key, attributes)
  const { Attributes: updated } = await ddbDocClient.send(command)
  if (!updated) throw new Error('Failed to update product.')
  return updated as Product
}
