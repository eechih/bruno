import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export const createProductTable = (
  scope: Construct,
  id: string
): dynamodb.ITable => {
  const table = new dynamodb.Table(scope, id, {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  })

  table.addGlobalSecondaryIndex({
    indexName: 'byOwner',
    partitionKey: {
      name: 'owner',
      type: dynamodb.AttributeType.STRING,
    },
    sortKey: {
      name: 'createdAt',
      type: dynamodb.AttributeType.STRING,
    },
  })
  return table
}
