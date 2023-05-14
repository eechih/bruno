import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb'

import { ddbDocClient } from '../base/ddbClient'

async function updateNote(note: any) {
  let prefix = 'set '
  let updateExpression = ''
  const expressionAttributeValues: Record<string, string> = {}
  const expressionAttributeNames: Record<string, string> = {}
  const attributes = Object.keys(note)
  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i]
    if (attribute !== 'id') {
      updateExpression += prefix + '#' + attribute + ' = :' + attribute
      expressionAttributeValues[':' + attribute] = note[attribute]
      expressionAttributeNames['#' + attribute] = attribute
      prefix = ', '
    }
  }
  const input: UpdateCommandInput = {
    TableName: process.env.NOTES_TABLE,
    Key: { id: note.id },
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    UpdateExpression: updateExpression,
    ReturnValues: 'UPDATED_NEW',
  }
  console.log('input: ', input)
  try {
    await ddbDocClient.send(new UpdateCommand(input))
    return note
  } catch (err) {
    console.log('DynamoDB error: ', err)
    return null
  }
}

export default updateNote
