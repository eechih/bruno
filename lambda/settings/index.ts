import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'

import DynamoDBDataClient from '../../libs/ddbDataClient'
import getSettings from './getSettings'
import {
  ResolverEventArgs,
  ResolverResults,
  UpdateBP1CookieArgs,
  UpdateFBCookieArgs,
} from './types'
import updateBP1Cookie from './updateBP1Cookie'
import updateFBCookie from './updateFBCookie'

const region = process.env.AWS_REGION!
const tableName = process.env.SETTINGS_TABLE_NAME!

export const dataClient = new DynamoDBDataClient({ region, tableName })

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
    return updateFBCookie(owner, input)
  } else if (fieldName == 'updateBP1Cookie') {
    const { input } = event.arguments as UpdateBP1CookieArgs
    return updateBP1Cookie(owner, input)
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}
