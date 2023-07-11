import { dataClient } from '.'
import { util } from '../../utils'
import { Settings } from './types'

export default async function (owner: string): Promise<Settings> {
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
