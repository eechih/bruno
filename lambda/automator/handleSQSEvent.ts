import { SQSEvent } from 'aws-lambda'

import publishProduct, { PublishProductParams } from './publishProduct'

export const isSQSEvent = (event: any): boolean => {
  return 'Records' in event
}

export default async function (event: SQSEvent): Promise<void> {
  await Promise.all(
    event.Records.map(async record => {
      console.log('Processing...', record.body)
      const params = JSON.parse(record.body) as PublishProductParams
      await publishProduct(params)
    })
  )
}
