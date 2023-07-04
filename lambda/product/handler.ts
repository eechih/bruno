import { AppSyncResolverEvent } from 'aws-lambda'

import createProduct from './createProduct'
import deleteProduct from './deleteProduct'
import getProduct from './getProduct'
import listProducts from './listProducts'
import publishProduct from './publishProduct'
import {
  CreateProductArgs,
  DeleteProductArgs,
  GetProductArgs,
  ListProductsArgs,
  PublishProductArgs,
  ResolverEventArguments,
  ResolverResult,
  UpdateProductArgs,
} from './types'
import updateProduct from './updateProduct'

export const handler = async (
  event: AppSyncResolverEvent<ResolverEventArguments>
): Promise<ResolverResult> => {
  console.log('Received event {}', JSON.stringify(event, null, 3))
  console.log('Got an Invoke Request.')
  const {
    info: { fieldName },
  } = event

  if (fieldName === 'listProducts') {
    const { limit, nextToken } = event.arguments as ListProductsArgs
    return listProducts({ limit, nextToken })
  } else if (fieldName === 'getProduct') {
    const { id } = event.arguments as GetProductArgs
    return getProduct({ id })
  } else if (fieldName === 'createProduct') {
    const { input } = event.arguments as CreateProductArgs
    return createProduct(input)
  } else if (fieldName === 'updateProduct') {
    const { input } = event.arguments as UpdateProductArgs
    return updateProduct(input)
  } else if (fieldName === 'deleteProduct') {
    const { input } = event.arguments as DeleteProductArgs
    return deleteProduct(input)
  } else if (fieldName === 'publishProduct') {
    const { input } = event.arguments as PublishProductArgs
    return publishProduct(input)
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}
