import { dataClient } from '.'
import { util } from '../../utils'
import { BP1Cookie, Settings, UpdateBP1CookieInput } from './types'

export default async function (
  owner: string,
  input: UpdateBP1CookieInput
): Promise<BP1Cookie> {
  const updated = await dataClient.updateItem<Settings>({
    key: { owner },
    attributeValues: {
      bp1Cookie: { ...input, updatedAt: util.time.nowISO8601() },
    },
  })
  if (!updated.bp1Cookie) throw new Error('Failed to update BP1 Cookie.')
  return updated.bp1Cookie
}
