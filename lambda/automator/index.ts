import DynamoDbClient from '../../libs/dynamodb/Client'
import S3Client from '../../libs/s3/Client'
import SQSClient from '../../libs/sqs/Client'
import handleAppSyncResolverEvent, {
  isAppSyncResolverEvent,
} from './handleAppSyncResolverEvent'
import handleSQSEvent, { isSQSEvent } from './handleSQSEvent'

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  bucketName: process.env.BUCKET_NAME!,
})

export const settingsTable = new DynamoDbClient({
  region: process.env.AWS_REGION!,
  tableName: process.env.SETTINGS_TABLE_NAME!,
})

export const productTable = new DynamoDbClient({
  region: process.env.AWS_REGION!,
  tableName: process.env.PRODUCT_TABLE_NAME!,
})

export const automatorQueue = new SQSClient({
  region: process.env.AWS_REGION!,
  queueUrl: process.env.AUTOMATOR_QUEUE_URL!,
})

export const handler = async (event: any): Promise<any> => {
  console.log('Received event {}', JSON.stringify(event, null, 3))
  if (isSQSEvent(event)) {
    return handleSQSEvent(event)
  } else if (isAppSyncResolverEvent(event)) {
    return handleAppSyncResolverEvent(event)
  } else {
    throw new Error('Unknown event:' + event)
  }
}
