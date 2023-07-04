import { Product, PublishProductInput } from './types'

export default async function publishProduct(
  input: PublishProductInput
): Promise<Product> {
  console.log('publishProduct', input)
  const { id } = input
  return {
    id: id,
    name: id + '- name',
    description: 'publishProduct',
  }
}
