import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { join } from 'path'

interface Buyplus1Props {
  layers: lambda.LayerVersion[]
  productTable: dynamodb.ITable
  bucket: s3.IBucket
}

export default class Buyplus1 extends Construct {
  public readonly handler: lambda.IFunction

  constructor(scope: Construct, id: string, props: Buyplus1Props) {
    super(scope, id)

    const lambdaDir = join(__dirname, '..', 'lambda')

    this.handler = new nodejs.NodejsFunction(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: join(lambdaDir, 'buyplus1', 'index.ts'),
      depsLockFilePath: join(__dirname, '..', 'pnpm-lock.yaml'),
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        PRODUCT_TABLE_NAME: props.productTable.tableName,
        BUCKET_NAME: props.bucket.bucketName,
      },
      layers: props.layers,
      memorySize: 1600,
      timeout: cdk.Duration.seconds(180),
    })

    // 👇 grant some permissions for the lambda role
    props.productTable.grantReadWriteData(this.handler)
    props.bucket.grantReadWrite(this.handler)
  }
}
