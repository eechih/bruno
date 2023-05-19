import { cache } from 'react'
import { Product } from './types'

export const getAllProducts = cache(async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': 'da2-hpl3eeg3qfgurjjllgzicicpiu',
        },
        body: JSON.stringify({
          query: `
          query ListProducts {
            listProducts {
              id
              name
              price
              cost
            }
          }
      `,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(response.statusText)
    }

    console.log('response', response)

    const result = await response.json()

    if (result === null) {
      throw new Error('Product not found')
    }

    return result.data.listProducts as Product[]
  } catch (error) {
    console.error(error)
  }
})
