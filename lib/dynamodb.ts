import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export const createProductTable = (scope: Construct): dynamodb.ITable => {
  const table = new dynamodb.Table(scope, 'ProductTable', {
    partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  })

  table.addGlobalSecondaryIndex({
    indexName: 'byOwner',
    partitionKey: { name: 'owner', type: dynamodb.AttributeType.STRING },
    sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
  })
  return table
}

export const createDataPointTable = (scope: Construct): dynamodb.ITable => {
  const table = new dynamodb.Table(scope, 'DataPointTable', {
    partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING },
    sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  })
  return table
}

export const createGenericDataPointTable = (
  scope: Construct
): dynamodb.ITable => {
  const table = new dynamodb.Table(scope, 'GenericDataPointTable', {
    partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
    sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  })
  return table
}
