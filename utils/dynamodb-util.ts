import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb'
import { isEmpty, isNil } from 'ramda'

export function toExclusiveStartKey(nextToken: string): Record<string, any> {
  const text = Buffer.from(nextToken, 'utf8').toString('base64')
  return JSON.parse(text)
}

export function toNextToken(lastEvaluatedKey: Record<string, any>) {
  const str = JSON.stringify(lastEvaluatedKey)
  return Buffer.from(str, 'utf8').toString('base64')
}

export function toUpdateCommand(
  tableName: string,
  key: Record<string, NativeAttributeValue>,
  attributes: Record<string, NativeAttributeValue>
): UpdateCommand {
  const keys: string[] = Object.entries(key).map(entry => entry[0])

  // Set up some space to keep track of things we're updating
  const expSet: Record<string, string> = {}
  const expRemove: Record<string, string> = {}
  const expNames: Record<string, string> = {}
  const expValues: Record<string, NativeAttributeValue> = {}

  // Iterate through each argument, skipping keys.
  // If the argument is set to "null" or "undefind", then remove that attribute from the item in DynamoDB.
  // Otherwise set (or update) the attribute on the item in DynamoDB.
  Object.entries(attributes).forEach(([key, value]) => {
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

  // Finally, write the update expression into the command, along with any expressionNames and expressionValues.
  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: expression,
    ExpressionAttributeNames: expNames,
    ExpressionAttributeValues: expValues,
    ReturnValues: 'ALL_NEW',
  })

  return command
}
