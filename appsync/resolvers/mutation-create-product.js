import { util } from '@aws-appsync/utils'

export function request(ctx) {
  const { input: values } = ctx.arguments
  const key = {
    id: util.autoId(),
  }
  return dynamodbPutRequest({ key, values })
}

export function response(ctx) {
  return ctx.result
}

/**
 * Helper function to create a new item
 * @returns a PutItem request
 */
function dynamodbPutRequest({ key, values }) {
  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues(key),
    attributeValues: util.dynamodb.toMapValues(values),
  }
}
