import { DeleteCommand, DeleteCommandInput } from '@aws-sdk/lib-dynamodb'

import { ddbDocClient } from '../base/ddbClient'

async function deleteNote(noteId: string) {
  const input: DeleteCommandInput = {
    TableName: process.env.NOTES_TABLE,
    Key: { id: noteId },
  }
  try {
    await ddbDocClient.send(new DeleteCommand(input))
    return noteId
  } catch (err) {
    console.log('DynamoDB error: ', err)
    return null
  }
}

export default deleteNote
