import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb'

import { ddbDocClient } from '../base/ddbClient'

async function listNotes() {
  const input: QueryCommandInput = {
    TableName: process.env.NOTES_TABLE,
  }
  try {
    const data = await ddbDocClient.send(new QueryCommand(input))
    return data.Items
  } catch (err) {
    console.log('DynamoDB error: ', err)
    return null
  }
}

export default listNotes
