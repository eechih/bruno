import { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda'

import DynamoDBDataClient from '../../libs/ddbDataClient'
import { util } from '../../utils'
import {
  Cookie,
  CookieConnection,
  CreateCookieArgs,
  DeleteCookieArgs,
  GetCookieArgs,
  ListCookiesArgs,
  UpdateCookieArgs,
} from './types'

const region = process.env.AWS_REGION!
const tableName = process.env.COOKIE_TABLE_NAME!
const dataClient = new DynamoDBDataClient({ region, tableName })

export const handler = async (
  event: AppSyncResolverEvent<
    | ListCookiesArgs
    | GetCookieArgs
    | CreateCookieArgs
    | UpdateCookieArgs
    | DeleteCookieArgs
  >
): Promise<CookieConnection | Cookie> => {
  console.log('Received event {}', JSON.stringify(event, null, 3))

  const { fieldName } = event.info
  const identity = event.identity as AppSyncIdentityCognito

  if (!identity) throw new Error('Forbidden, missing identity information')

  const { sub: owner } = identity

  if (fieldName === 'listCookies') {
    return listCookies(event.arguments as ListCookiesArgs, owner)
  } else if (fieldName === 'getCookie') {
    return getCookie(event.arguments as GetCookieArgs, owner)
  } else if (fieldName === 'createCookie') {
    return createCookie(event.arguments as CreateCookieArgs, owner)
  } else if (fieldName === 'updateCookie') {
    return updateCookie(event.arguments as UpdateCookieArgs, owner)
  } else if (fieldName === 'deleteCookie') {
    return deleteCookie(event.arguments as DeleteCookieArgs, owner)
  } else {
    throw new Error('Unknown field, unable to resolve' + fieldName)
  }
}

export async function listCookies(
  args: ListCookiesArgs,
  owner: string
): Promise<CookieConnection> {
  console.log('listCookies', args)
  const connection = await dataClient.query<Cookie>({
    query: {
      expression: '#owner = :owner',
      expressionNames: { '#owner': 'owner' },
      expressionValues: { ':owner': owner },
    },
    index: 'byOwner',
    limit: args.limit,
    nextToken: args.nextToken,
    scanIndexForward: false,
  })
  return connection
}

export async function getCookie(
  args: GetCookieArgs,
  owner: string
): Promise<Cookie> {
  console.log('getCookie', args)
  const cookie = await dataClient.getItem<Cookie>({
    key: { id: args.id },
  })
  if (!cookie) throw new Error('Cookie not found')
  return cookie
}

export async function createCookie(
  args: CreateCookieArgs,
  owner: string
): Promise<Cookie> {
  console.log('createCookie', args)
  const { input } = args
  const created = await dataClient.putItem<Cookie>({
    key: { id: util.autoId() },
    attributeValues: {
      ...input,
      createdAt: util.time.nowISO8601(),
      owner: owner,
    },
  })
  if (!created) throw new Error('Failed to create cookie')
  return created
}

export async function updateCookie(
  args: UpdateCookieArgs,
  owner: string
): Promise<Cookie> {
  console.log('updateCookie', args)
  const { input } = args
  const updated = await dataClient.updateItem<Cookie>({
    key: { id: input.id },
    attributeValues: {
      ...input,
      updatedAt: util.time.nowISO8601(),
    },
  })
  if (!updated) throw new Error('Failed to update cookie.')
  return updated
}

export async function deleteCookie(
  args: DeleteCookieArgs,
  owner: string
): Promise<Cookie> {
  console.log('deleteCookie', args)
  const { input } = args
  const deleted = await dataClient.deleteItem<Cookie>({
    key: { id: input.id },
  })
  if (!deleted) throw new Error('Failed to delete cookie')
  return deleted
}
