import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'

import { Product } from '../product/types'
import postInFB from './postInFB'
import { asyncPublishProduct, PublishProductParams } from './publishProduct'
import { PublishProductArgs } from './types'

export const isAppSyncResolverEvent = (event: any): boolean => {
  return (
    'arguments' in event &&
    'source' in event &&
    'request' in event &&
    'info' in event &&
    'prev' in event &&
    'stash' in event
  )
}

export default async function (
  event: AppSyncResolverEvent<PublishProductArgs>
): Promise<Product | string | void> {
  const identity = event.identity as AppSyncIdentityCognito
  if (!identity) {
    throw new Error('Forbidden, missing identity information')
  }
  const { sub: owner } = identity
  const { fieldName } = event.info

  if (fieldName === 'asyncPublishProduct') {
    const { input } = event.arguments as PublishProductArgs
    const params: PublishProductParams = { productId: input.id, owner }
    return await asyncPublishProduct(params)
  } else if (fieldName === 'postInFB') {
    return postInFB()
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}
