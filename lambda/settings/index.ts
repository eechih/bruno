import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'

import DynamodbClient from '../../libs/dynamodb/Client'
import { util } from '../../utils'
import {
  BP1Cookie,
  FBCookie,
  ResolverEventArgs,
  ResolverResults,
  Settings,
  UpdateBP1CookieArgs,
  UpdateBP1CookieInput,
  UpdateFBCookieArgs,
  UpdateFBCookieInput,
} from './types'

export const settingsTable = new DynamodbClient({
  region: process.env.AWS_REGION!,
  tableName: process.env.SETTINGS_TABLE_NAME!,
})

export const handler = async (
  event: AppSyncResolverEvent<ResolverEventArgs>
): Promise<ResolverResults> => {
  console.log('Received event {}', JSON.stringify(event, null, 3))

  const identity = event.identity as AppSyncIdentityCognito
  if (!identity) {
    throw new Error('Forbidden, missing identity information')
  }
  const { sub: owner } = identity
  const { fieldName } = event.info

  if (fieldName == 'getSettings') {
    return getSettings(owner)
  } else if (fieldName == 'updateFBCookie') {
    const { input } = event.arguments as UpdateFBCookieArgs
    return updateFBCookie(input, owner)
  } else if (fieldName == 'updateBP1Cookie') {
    const { input } = event.arguments as UpdateBP1CookieArgs
    return updateBP1Cookie(input, owner)
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}

const getSettings = async (owner: string): Promise<Settings> => {
  const settings = await settingsTable.getItem<Settings>({
    key: { owner },
  })
  if (!settings) {
    const created = await settingsTable.putItem<Settings>({
      key: { owner },
      attributeValues: {
        createdAt: util.time.nowISO8601(),
        owner: owner,
      },
    })
    if (!created) throw new Error('Failed to create cookie')
    return created
  }
  return settings
}

const updateBP1Cookie = async (
  input: UpdateBP1CookieInput,
  owner: string
): Promise<BP1Cookie> => {
  const updated = await settingsTable.updateItem<Settings>({
    key: { owner },
    attributeValues: {
      bp1Cookie: { ...input, updatedAt: util.time.nowISO8601() },
    },
  })
  if (!updated.bp1Cookie) throw new Error('Failed to update BP1 Cookie.')
  return updated.bp1Cookie
}

const updateFBCookie = async (
  input: UpdateFBCookieInput,
  owner: string
): Promise<FBCookie> => {
  const updated = await settingsTable.updateItem<Settings>({
    key: { owner },
    attributeValues: {
      fbCookie: { ...input, updatedAt: util.time.nowISO8601() },
    },
  })
  if (!updated.fbCookie) throw new Error('Failed to update FB Cookie.')
  return updated.fbCookie
}
