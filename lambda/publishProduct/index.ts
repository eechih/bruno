import { AppSyncResolverEvent } from 'aws-lambda'

type Arguments = {
  input: { id: string }
}

type Product = {
  id: string
  name: string
  description?: string
  price?: number
  cost?: number
  optionGrid?: string[]
  images?: string[]
  provider?: string
  offShelfAt?: string
  publishAt?: string
  createdAt?: string
  updatedAt?: string
  owner?: string
}

exports.handler = async (
  event: AppSyncResolverEvent<Arguments>
): Promise<Product | null> => {
  console.log('request:', JSON.stringify(event, undefined, 2))
  const {
    arguments: {
      input: { id },
    },
    info: { fieldName },
  } = event

  if (fieldName !== 'publishProduct') return null

  return {
    id: id,
    name: id,
  }
}
