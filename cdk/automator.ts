import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { join } from 'path'

interface AutomatorProps {
  layers: lambda.LayerVersion[]
  bucket: s3.IBucket
  settingsTable: dynamodb.ITable
  productTable: dynamodb.ITable
}

export default class Automator extends Construct {
  public readonly handler: lambda.IFunction

  constructor(scope: Construct, id: string, props: AutomatorProps) {
    super(scope, id)

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
        BUCKET_NAME: props.bucket.bucketName,
        SETTINGS_TABLE_NAME: props.settingsTable.tableName,
        PRODUCT_TABLE_NAME: props.productTable.tableName,
      },
      layers: props.layers,
      memorySize: 1600,
      timeout: cdk.Duration.seconds(180),
    })

    // 👇 grant some permissions for the lambda role
    props.bucket.grantReadWrite(this.handler)
    props.settingsTable.grantReadWriteData(this.handler)
    props.productTable.grantReadWriteData(this.handler)
  }
}
