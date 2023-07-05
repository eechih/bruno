import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb'
import { isEmpty, isNil } from 'ramda'

import { util } from '../utils'

type DynamoDBDataClientConfig = {
  region: string
  tableName: string
}

export type Expression = {
  expression?: string
  expressionNames?: Record<string, string>
  expressionValues?: Record<string, NativeAttributeValue>
}
export interface GetItemParams {
  key: Record<string, NativeAttributeValue>
  consistentRead?: boolean
}
export interface PutItemParams {
  key: Record<string, NativeAttributeValue>
  attributeValues: Record<string, NativeAttributeValue>
  condition?: Expression
}
export interface UpdateItemParams {
  key: Record<string, NativeAttributeValue>
  attributeValues: Record<string, NativeAttributeValue>
  condition?: Expression
}
export interface DeleteItemParams {
  key: Record<string, NativeAttributeValue>
  condition?: Expression
}
export interface QueryParams {
  query?: Expression
  filter?: Expression
  index?: string
  nextToken?: string
  limit?: number
  scanIndexForward?: boolean
  consistentRead?: boolean
  select?: string
}

export default class DynamoDBDataClient {
  private ddbClient: DynamoDBClient
  private ddbDocClient: DynamoDBDocumentClient
  private tableName: string

  constructor(config: DynamoDBDataClientConfig) {
    const { region, tableName } = config
    if (!tableName || !region) {
      throw new Error(
        `Invalid DynamoDBConfig ${JSON.stringify(config, null, 2)}`
      )
    }
    this.tableName = tableName
    this.ddbClient = new DynamoDBClient({ region })
    this.ddbDocClient = DynamoDBDocumentClient.from(this.ddbClient, {
      marshallOptions: {
        // Whether to automatically convert empty strings, blobs, and sets to `null`.
        convertEmptyValues: false,
        // Whether to remove undefined values while marshalling.
        removeUndefinedValues: true,
        // Whether to convert typeof object to map attribute.
        convertClassInstanceToMap: false,
      },
      unmarshallOptions: {
        // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
        wrapNumbers: false,
      },
    })
  }

  async getItem<T>(params: GetItemParams): Promise<T | null> {
    const { key, consistentRead = false } = params
    const command = new GetCommand({
      TableName: this.tableName,
      Key: key,
      ConsistentRead: consistentRead,
    })
    const result = await this.ddbDocClient.send(command)
    if (!result.Item) return null
    return result.Item as T
  }

  async putItem<T>(params: PutItemParams): Promise<T | null> {
    const { key, attributeValues, condition = {} } = params
    const command = new PutCommand({
      TableName: this.tableName,
      Item: { ...attributeValues, ...key },
      ConditionExpression: condition.expression,
      ExpressionAttributeNames: condition.expressionNames,
      ExpressionAttributeValues: condition.expressionValues,
    })
    await this.ddbDocClient.send(command)
    return this.getItem({ key, consistentRead: true })
  }

  async updateItem<T>(params: UpdateItemParams): Promise<T> {
    const { key, condition = {} } = params
    const update = this.toUpdateExpression(params)
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: key,
      UpdateExpression: update.expression,
      ConditionExpression: condition.expression,
      ExpressionAttributeNames: util.undefinedIfEmpty({
        ...(condition.expressionNames || {}),
        ...(update.expressionNames || {}),
      }),
      ExpressionAttributeValues: util.undefinedIfEmpty({
        ...(condition.expressionValues || {}),
        ...(update.expressionValues || {}),
      }),
      ReturnValues: 'ALL_NEW',
    })
    const { Attributes: updated } = await this.ddbDocClient.send(command)
    return updated as T
  }

  private toUpdateExpression(params: UpdateItemParams): Expression {
    const { key, attributeValues = {} } = params
    const keys: string[] = Object.entries(key).map(entry => entry[0])

    // Set up some space to keep track of things we're updating
    const expSet: Record<string, string> = {}
    const expRemove: Record<string, string> = {}
    const expNames: Record<string, string> = {}
    const expValues: Record<string, NativeAttributeValue> = {}

    // Iterate through each argument, skipping keys.
    // If the argument is set to "null" or "undefind", then remove that attribute from the item in DynamoDB.
    // Otherwise set (or update) the attribute on the item in DynamoDB.
    Object.entries(attributeValues).forEach(([key, value]) => {
      if (keys.includes(key)) return

      if (isNil(value)) {
        expRemove[`#${key}`] = `:${key}`
        expNames[`#${key}`] = key
      } else {
        expSet[`#${key}`] = `:${key}`
        expNames[`#${key}`] = key
        expValues[`:${key}`] = value
      }
    })

    // Start building the update expression, starting with attributes we're going to SET.
    let expression = ''
    if (!isEmpty(expSet)) {
      expression += 'SET '
      Object.entries(expSet).forEach(([key, value], index) => {
        if (index == 0) expression += `${key} = ${value}`
        else expression += `, ${key} = ${value}`
      })
    }

    // Continue building the update expression, adding attributes we're going to REMOVE.
    if (!isEmpty(expRemove)) {
      expression += ' REMOVE '
      Object.entries(expRemove).forEach(([key, value], index) => {
        if (index == 0) expression += `${key} = ${value}`
        else expression += `, ${key} = ${value}`
      })
    }

    return {
      expression,
      expressionNames: expNames,
      expressionValues: expValues,
    }
  }

  async deleteItem<T>(params: DeleteItemParams): Promise<T> {
    const { key, condition = {} } = params
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: key,
      ConditionExpression: condition.expression,
      ExpressionAttributeNames: condition.expressionNames,
      ExpressionAttributeValues: condition.expressionValues,
      ReturnValues: 'ALL_OLD',
    })
    const { Attributes: deleted } = await this.ddbDocClient.send(command)
    return deleted as T
  }

  async query<T>(
    params: QueryParams
  ): Promise<{ items: T[]; scannedCount?: number; nextToken?: string }> {
    const {
      query: keyCondition = {},
      filter = {},
      index,
      nextToken,
      limit,
      scanIndexForward = true,
      consistentRead = false,
      select = 'ALL_ATTRIBUTES',
    } = params

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: keyCondition.expression,
      FilterExpression: filter.expression,
      ExpressionAttributeNames: util.undefinedIfEmpty({
        ...(filter.expressionNames || {}),
        ...(keyCondition.expressionNames || {}),
      }),
      ExpressionAttributeValues: util.undefinedIfEmpty({
        ...(filter.expressionValues || {}),
        ...(keyCondition.expressionValues || {}),
      }),
      ExclusiveStartKey: nextToken
        ? this.toExclusiveStartKey(nextToken)
        : undefined,
      IndexName: index,
      Limit: limit,
      ConsistentRead: consistentRead,
      ScanIndexForward: scanIndexForward,
      Select: select,
    })
    console.log('QueryCommand input', command.input)
    const {
      Items: items = [],
      ScannedCount: scannedCount,
      LastEvaluatedKey: lastEvaluatedKey,
    } = await this.ddbDocClient.send(command)

    return {
      items: items.map(item => item as T),
      scannedCount,
      nextToken: lastEvaluatedKey
        ? this.toNextToken(lastEvaluatedKey)
        : undefined,
    }
  }

  private toExclusiveStartKey(
    nextToken: string
  ): Record<string, NativeAttributeValue> {
    return JSON.parse(Buffer.from(nextToken, 'base64').toString('utf8'))
  }

  private toNextToken(
    lastEvaluatedKey: Record<string, NativeAttributeValue>
  ): string {
    return Buffer.from(JSON.stringify(lastEvaluatedKey), 'utf8').toString(
      'base64'
    )
  }
}
