import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'

import { UpdateProductInput } from '../../../../lambda/product'
import updateProduct from '../../../../lambda/product/updateProduct'

const ddbMock = mockClient(DynamoDBDocumentClient)

beforeEach(() => {
  ddbMock.reset()
})

test('should update product to the DynamoDB', async () => {
  const input: UpdateProductInput = {
    id: 'f05ff737-fd5f-4976-956c-2696e2dde49d',
    name: 'Amazon Essentials Women High-Rise Skinny Jean',
    price: 3990,
    images: ['public/83/838dbf6f-94d3-483f-a028-aeb170b82ca9.jpg'],
    provider: undefined,
  }

  ddbMock.on(UpdateCommand).resolves({
    Attributes: input,
  })

  await updateProduct(input)

  expect(ddbMock).toHaveReceivedCommandWith(UpdateCommand, {
    Key: { id: input.id },
    UpdateExpression:
      'SET #name = :name, #price = :price, #images = :images REMOVE #provider = :provider',
    ExpressionAttributeNames: {
      '#name': 'name',
      '#price': 'price',
      '#images': 'images',
      '#provider': 'provider',
    },
    ExpressionAttributeValues: {
      ':name': input.name,
      ':price': input.price,
      ':images': input.images,
    },
    ReturnValues: 'ALL_NEW',
  })
})
