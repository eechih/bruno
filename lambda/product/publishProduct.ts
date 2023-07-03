import { Product, PublishProductArgs } from './types'

export default async function (args: PublishProductArgs): Promise<Product> {
  console.log('deleteProduct', args)
  const id = args.input.id
  return {
    id: id,
    name: id + '- name',
    description: 'publishProduct',
  }
}
