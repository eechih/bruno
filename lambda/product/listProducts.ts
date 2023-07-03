import { ListProductsArgs, ProductConnection } from './types'

export default async function (
  args: ListProductsArgs
): Promise<ProductConnection> {
  const { limit } = args
  const items = Array.from(Array(limit)).map((v, index) => {
    return { id: `${index}` }
  })
  return {
    items: items,
  }
}
