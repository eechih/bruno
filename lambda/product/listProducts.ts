import { ProductConnection } from './types'

export default async function listProducts(args: {
  limit?: number
  nextToken?: string
}): Promise<ProductConnection> {
  console.log('listProducts', args)
  const items = Array.from(Array(args.limit)).map((v, index) => {
    return { id: `${index}` }
  })
  return {
    items: items,
  }
}
