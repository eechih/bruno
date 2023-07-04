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
    return listProducts(event.arguments as ListProductsArgs)
  } else if (fieldName === 'getProduct') {
    return getProduct(event.arguments as GetProductArgs)
  } else if (fieldName === 'createProduct') {
    return createProduct(event.arguments as CreateProductArgs)
  } else if (fieldName === 'updateProduct') {
    const { input } = event.arguments as UpdateProductArgs
    return updateProduct(input)
  } else if (fieldName === 'deleteProduct') {
    return deleteProduct(event.arguments as DeleteProductArgs)
  } else if (fieldName === 'publishProduct') {
    return publishProduct(event.arguments as PublishProductArgs)
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}
