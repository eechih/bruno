import { cache } from 'react'

import { CreateProductInput, Product } from '@/graphql/API'
import * as mutations from '@/graphql/mutations'
import * as queries from '@/graphql/queries'

const GRAPHQL_ENDPOINT = `${process.env.NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT}`
const APIKEY = `${process.env.NEXT_PUBLIC_AWS_APPSYNC_APIKEY}`

export const getAllProducts = cache(async () => {
  try {
    const requestBody = {
      query: queries.listProducts,
    }
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': APIKEY,
      },
      body: JSON.stringify(requestBody),
      next: { revalidate: 0 },
    }
    const response = await (await fetch(GRAPHQL_ENDPOINT, options)).json()
    console.log('RESPONSE FROM FETCH REQUEST', response?.data)
    return response?.data?.listProducts as Product[]
  } catch (err) {
    console.log('ERROR DURING FETCH REQUEST', err)
  }
})

export const getProduct = cache(async (productId: string) => {
  try {
    const requestBody = {
      query: queries.getProduct,
      variables: { id: productId },
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': APIKEY,
      },
      body: JSON.stringify(requestBody),
    }
    const response = await (await fetch(GRAPHQL_ENDPOINT, options)).json()
    console.log('RESPONSE FROM FETCH REQUEST', response?.data)
    return response?.data?.getProduct as Product
  } catch (err) {
    console.log('ERROR DURING FETCH REQUEST', err)
  }
})

export const createProduct = cache(async (input: CreateProductInput) => {
  try {
    const requestBody = {
      query: mutations.createProduct,
      variables: { input },
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': APIKEY,
      },
      body: JSON.stringify(requestBody),
    }
    const response = await (await fetch(GRAPHQL_ENDPOINT, options)).json()
    console.log('RESPONSE FROM FETCH REQUEST', response?.data)
    return response?.data?.createProduct as Product
  } catch (err) {
    console.log('ERROR DURING FETCH REQUEST', err)
  }
})
