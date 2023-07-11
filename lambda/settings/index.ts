import { AppSyncResolverEvent } from 'aws-lambda'

import DynamoDBDataClient from '../../libs/ddbDataClient'
import { util } from '../../utils'
import { updateBP1CookieHandler, updateFBCookieHandler } from './cookie'
import { ResolverEventArgs, ResolverResults, Settings } from './types'
import { getIdentitySub } from './util'

const region = process.env.AWS_REGION!
const tableName = process.env.SETTINGS_TABLE_NAME!

export const dataClient = new DynamoDBDataClient({ region, tableName })

export const handler = async (
  event: AppSyncResolverEvent<ResolverEventArgs>
): Promise<ResolverResults> => {
  console.log('Received event {}', JSON.stringify(event, null, 3))

  const { fieldName } = event.info

  if (fieldName === 'getSettings') {
    return getSettins(event)
  } else if (fieldName === 'updateFBCookie') {
    return updateFBCookieHandler(event)
  } else if (fieldName === 'updateBP1Cookie') {
    return updateBP1CookieHandler(event)
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}

export const getSettins = async (
  event: AppSyncResolverEvent<ResolverEventArgs>
): Promise<Settings> => {
  const owner = getIdentitySub(event)
  const settings = await dataClient.getItem<Settings>({
    key: { owner },
  })
  if (!settings) {
    const created = await dataClient.putItem<Settings>({
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
