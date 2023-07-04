import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb'
import { isEmpty, isNil } from 'ramda'

import { ddbDocClient } from '../libs/ddbClient'
import { Product, UpdateProductInput } from './types'

export default async function (input: UpdateProductInput): Promise<Product> {
  console.log('updateProduct', input)

  // Set up some space to keep track of things we're updating
  const expSet: Record<string, string> = {}
  const expRemove: Record<string, string> = {}
  const expNames: Record<string, string> = {}
  const expValues: Record<string, NativeAttributeValue> = {}

  // Iterate through each argument, skipping keys.
  // If the argument is set to "null" or "undefind", then remove that attribute from the item in DynamoDB.
  // Otherwise set (or update) the attribute on the item in DynamoDB.
  Object.entries(input).forEach(([key, value]) => {
    if (key === 'id') return

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
    TableName: process.env.PRODUCT_TABLE_NAME,
    Key: { id: input.id },
    UpdateExpression: expression,
    ExpressionAttributeNames: expNames,
    ExpressionAttributeValues: expValues,
    ReturnValues: 'ALL_NEW',
  })

  console.log('command.input', command.input)

  const response = await ddbDocClient.send(command)
  if (!response.Attributes) throw new Error('Failed to update product.')
  return response.Attributes as Product
}
