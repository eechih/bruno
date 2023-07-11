import { dataClient } from '.'
import { util } from '../../utils'
import { FBCookie, Settings, UpdateFBCookieInput } from './types'

export default async function (
  owner: string,
  input: UpdateFBCookieInput
): Promise<FBCookie> {
  const updated = await dataClient.updateItem<Settings>({
    key: { owner },
    attributeValues: {
      fbCookie: { ...input, updatedAt: util.time.nowISO8601() },
    },
  })
  if (!updated.fbCookie) throw new Error('Failed to update FB Cookie.')
  return updated.fbCookie
}
