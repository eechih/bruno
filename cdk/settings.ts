import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import { join } from 'path'

export default class Settings extends Construct {
  public readonly table: dynamodb.Table
  public readonly handler: lambda.IFunction

  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.table = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'owner', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    })

    const lambdaDir = join(__dirname, '..', 'lambda')

    this.handler = new nodejs.NodejsFunction(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: join(lambdaDir, 'settings', 'index.ts'),
      depsLockFilePath: join(__dirname, '..', 'pnpm-lock.yaml'),
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        SETTINGS_TABLE_NAME: this.table.tableName,
      },
    })

    // 👇 grant some permissions for the lambda role
    this.table.grantReadWriteData(this.handler)

    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
    })
  }
}
