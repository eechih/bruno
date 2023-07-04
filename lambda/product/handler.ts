import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'

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

  const { fieldName } = event.info
  const identity = event.identity as AppSyncIdentityCognito

  if (!identity) throw new Error('Forbidden, missing identity information')

  const { sub: owner } = identity

  if (fieldName === 'listProducts') {
    const args = event.arguments as ListProductsArgs
    return listProducts({ ...args, owner })
  } else if (fieldName === 'getProduct') {
    const args = event.arguments as GetProductArgs
    return getProduct({ ...args, owner })
  } else if (fieldName === 'createProduct') {
    const { input } = event.arguments as CreateProductArgs
    return createProduct({ input, owner })
  } else if (fieldName === 'updateProduct') {
    const { input } = event.arguments as UpdateProductArgs
    return updateProduct({ input, owner })
  } else if (fieldName === 'deleteProduct') {
    const { input } = event.arguments as DeleteProductArgs
    return deleteProduct({ input, owner })
  } else if (fieldName === 'publishProduct') {
    const { input } = event.arguments as PublishProductArgs
    return publishProduct({ input, owner })
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}
