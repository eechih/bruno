import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sources from 'aws-cdk-lib/aws-lambda-event-sources'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'
import { join } from 'path'

const QUEUE_VISIBILITY_TIMEOUT = cdk.Duration.seconds(180)
const HANDLER_TIMEOUT = cdk.Duration.seconds(180)

interface AutomatorProps {
  layers: lambda.LayerVersion[]
  bucket: s3.IBucket
  settingsTable: dynamodb.ITable
  productTable: dynamodb.ITable
}

export default class Automator extends Construct {
  public readonly dlqueue: sqs.Queue
  public readonly queue: sqs.Queue
  public readonly handler: lambda.IFunction

  constructor(scope: Construct, id: string, props: AutomatorProps) {
    super(scope, id)

    this.dlqueue = new sqs.Queue(this, 'DLQueue', {
      retentionPeriod: cdk.Duration.days(14),
    })

    this.queue = new sqs.Queue(this, 'Queue', {
      visibilityTimeout: QUEUE_VISIBILITY_TIMEOUT,
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: this.dlqueue,
      },
    })

    const lambdaDir = join(__dirname, '..', 'lambda')

    this.handler = new nodejs.NodejsFunction(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: join(lambdaDir, 'automator', 'index.ts'),
      depsLockFilePath: join(__dirname, '..', 'pnpm-lock.yaml'),
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        AUTOMATOR_QUEUE_URL: this.queue.queueUrl,
        AUTOMATOR_DLQUEUE_URL: this.dlqueue.queueUrl,
        BUCKET_NAME: props.bucket.bucketName,
        SETTINGS_TABLE_NAME: props.settingsTable.tableName,
        PRODUCT_TABLE_NAME: props.productTable.tableName,
      },
      layers: props.layers,
      memorySize: 1600,
      timeout: HANDLER_TIMEOUT,
    })

    // 👇 grant some permissions for the lambda role
    this.queue.grantSendMessages(this.handler)
    this.dlqueue.grantSendMessages(this.handler)
    props.bucket.grantReadWrite(this.handler)
    props.settingsTable.grantReadWriteData(this.handler)
    props.productTable.grantReadWriteData(this.handler)

    this.handler.addEventSource(
      new sources.SqsEventSource(this.queue, { batchSize: 1 })
    )
  }
}
