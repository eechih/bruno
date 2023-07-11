import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'
import { ResolverEventArgs } from './types'

export const getIdentitySub = (
  event: AppSyncResolverEvent<ResolverEventArgs>
): string => {
  const identity = event.identity as AppSyncIdentityCognito
  if (!identity) throw new Error('Forbidden, missing identity information')
  return identity.sub
}
