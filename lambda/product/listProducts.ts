import { QueryCommand } from '@aws-sdk/lib-dynamodb'

import { ddbDocClient } from '../../libs/ddbClient'
import { toExclusiveStartKey, toNextToken } from '../../utils/dynamodb-util'
import { Product, ProductConnection } from './types'

const tableName = process.env.PRODUCT_TABLE_NAME!

export default async function listProducts(args: {
  limit?: number
  nextToken?: string
  owner?: string
}): Promise<ProductConnection> {
  console.log('listProducts', args)
  const { limit, nextToken, owner } = args
  const command = new QueryCommand({
    TableName: tableName,
    Limit: limit,
    ExclusiveStartKey: nextToken ? toExclusiveStartKey(nextToken) : undefined,
    IndexName: 'byOwner',
    KeyConditionExpression: '#owner = :owner',
    ExpressionAttributeNames: { '#owner': 'owner' },
    ExpressionAttributeValues: { ':owner': owner },
  })
  console.log('QueryCommand input', command.input)
  const {
    Items: items = [],
    ScannedCount: scannedCount,
    LastEvaluatedKey: lastEvaluatedKey,
  } = await ddbDocClient.send(command)

  return {
    items: items.map(item => item as Product),
    nextToken: lastEvaluatedKey ? toNextToken(lastEvaluatedKey) : undefined,
  }
}
