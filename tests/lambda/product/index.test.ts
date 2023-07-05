import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { AppSyncResolverEvent } from 'aws-lambda'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'

import { updateProduct } from '../../../lambda/product'
import {
  PublishProductArgs,
  UpdateProductInput,
} from '../../../lambda/product/types'

const ddbMock = mockClient(DynamoDBDocumentClient)

beforeEach(() => {
  ddbMock.reset()
})

const eventJSON: AppSyncResolverEvent<PublishProductArgs> = {
  arguments: {
    input: {
      id: '111',
    },
  },
  identity: {
    sub: 'mock',
    issuer: 'mock',
    username: 'mock',
    claims: {},
    sourceIp: [],
    defaultAuthStrategy: '',
    groups: [],
  },
  source: null,
  request: { headers: {}, domainName: null },
  info: {
    selectionSetList: [],
    selectionSetGraphQL: '',
    parentTypeName: 'mutation',
    fieldName: 'deleteProduct',
    variables: {},
  },
  prev: null,
  stash: {},
}

test('should update product to the DynamoDB', async () => {
  const input: UpdateProductInput = {
    id: 'f05ff737-fd5f-4976-956c-2696e2dde49d',
    name: 'Amazon Essentials Women High-Rise Skinny Jean',
    price: 3990,
    images: ['public/83/838dbf6f-94d3-483f-a028-aeb170b82ca9.jpg'],
  }

  ddbMock.on(UpdateCommand).resolves({
    Attributes: input,
  })

  const updated = await updateProduct({ input }, 'mock')
  expect(updated).toEqual(input)
  expect(ddbMock).toHaveReceivedCommandTimes(UpdateCommand, 1)
})
