import { Product, PublishProductInput } from './types'

interface PublishProductParams {
  input: PublishProductInput
  owner: string
}

export default async function publishProduct({
  input,
  owner,
}: PublishProductParams): Promise<Product> {
  console.log('publishProduct', input)
  const { id } = input
  return {
    id: id,
    name: id + '- name',
    description: 'publishProduct',
  }
}
