import { AppSyncResolverEvent } from 'aws-lambda'

import { dataClient } from '.'
import { util } from '../../utils'
import {
  BP1Cookie,
  FBCookie,
  ResolverEventArgs,
  Settings,
  UpdateBP1CookieArgs,
  UpdateFBCookieArgs,
} from './types'
import { getIdentitySub } from './util'

export const updateFBCookieHandler = async (
  event: AppSyncResolverEvent<ResolverEventArgs>
): Promise<FBCookie> => {
  const owner = getIdentitySub(event)
  const { input } = event.arguments as UpdateFBCookieArgs
  const updated = await dataClient.updateItem<Settings>({
    key: { owner },
    attributeValues: {
      fbCookie: { ...input, updatedAt: util.time.nowISO8601() },
    },
  })
  if (!updated.fbCookie) throw new Error('Failed to update FB Cookie.')
  return updated.fbCookie
}

export const updateBP1CookieHandler = async (
  event: AppSyncResolverEvent<ResolverEventArgs>
): Promise<BP1Cookie> => {
  const owner = getIdentitySub(event)
  const { input } = event.arguments as UpdateBP1CookieArgs
  const updated = await dataClient.updateItem<Settings>({
    key: { owner },
    attributeValues: {
      bp1Cookie: { ...input, updatedAt: util.time.nowISO8601() },
    },
  })
  if (!updated.bp1Cookie) throw new Error('Failed to update BP1 Cookie.')
  return updated.bp1Cookie
}
