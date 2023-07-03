import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sources from 'aws-cdk-lib/aws-lambda-event-sources'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'
import { join } from 'path'

export default class Product extends Construct {
  public readonly dlqueue: sqs.Queue
  public readonly queue: sqs.Queue
  public readonly table: dynamodb.Table
  public readonly handler: lambda.IFunction

  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.dlqueue = new sqs.Queue(this, 'DLQueue', {
      retentionPeriod: cdk.Duration.days(14),
    })

    this.queue = new sqs.Queue(this, 'Queue', {
      visibilityTimeout: cdk.Duration.seconds(60),
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: this.dlqueue,
      },
    })

    this.table = new dynamodb.Table(scope, 'Table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    })

    this.table.addGlobalSecondaryIndex({
      indexName: 'byOwner',
      partitionKey: { name: 'owner', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    })

    const lambdaDir = join(__dirname, '..', 'lambda')

    this.handler = new nodejs.NodejsFunction(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: join(lambdaDir, 'product', 'index.ts'),
      depsLockFilePath: join(__dirname, '..', 'pnpm-lock.yaml'),
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        PRODUCT_TABLE_NAME: this.table.tableName,
        PRODUCT_QUEUE_URL: this.queue.queueUrl,
        PRODUCT_DLQUEUE_URL: this.dlqueue.queueUrl,
      },
    })

    // 👇 grant some permissions for the lambda role
    this.table.grantReadWriteData(this.handler)
    this.queue.grantSendMessages(this.handler)
    this.dlqueue.grantSendMessages(this.handler)

    this.handler.addEventSource(
      new sources.SqsEventSource(this.queue, { batchSize: 1 })
    )
  }
}
