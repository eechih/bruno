import 'aws-sdk-client-mock-jest'

import { util } from '../../utils'
import { toUpdateCommand } from '../../utils/dynamodb-util'

test('should convert to UpdateCommand', async () => {
  const tableName = 'mock'
  const key = { id: 'mock' }
  const attributes = {
    name: 'mock',
    price: 100,
    images: ['mock'],
    provider: undefined,
    updatedAt: util.time.nowISO8601(),
  }
  const command = toUpdateCommand(tableName, key, attributes)

  expect(command.input).toEqual({
    TableName: tableName,
    Key: key,
    UpdateExpression:
      'SET #name = :name, #price = :price, #images = :images, #updatedAt = :updatedAt REMOVE #provider = :provider',
    ExpressionAttributeNames: {
      '#name': 'name',
      '#price': 'price',
      '#images': 'images',
      '#provider': 'provider',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':name': attributes.name,
      ':price': attributes.price,
      ':images': attributes.images,
      ':updatedAt': attributes.updatedAt,
    },
    ReturnValues: 'ALL_NEW',
  })
})
