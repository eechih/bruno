import { GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb'

import { ddbDocClient } from '../base/ddbClient'

async function getNoteById(noteId: string) {
  const input: GetCommandInput = {
    TableName: process.env.NOTES_TABLE,
    Key: { id: noteId },
  }
  try {
    const { Item } = await ddbDocClient.send(new GetCommand(input))
    return Item
  } catch (err) {
    console.log('DynamoDB error: ', err)
    return null
  }
}

export default getNoteById
