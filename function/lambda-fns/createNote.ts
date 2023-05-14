import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb'

import { ddbDocClient } from '../base/ddbClient'
import Note from './Note'

async function createNote(note: Note) {
  const input: PutCommandInput = {
    TableName: process.env.NOTES_TABLE,
    Item: note,
  }
  try {
    await ddbDocClient.send(new PutCommand(input))
    return note
  } catch (err) {
    console.log('DynamoDB error: ', err)
    return null
  }
}

export default createNote
