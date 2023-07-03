import { AppSyncResolverEvent } from 'aws-lambda'
import { handler } from '../../../../lambda/product'
import { PublishProductArgs } from '../../../../lambda/product/types'

const eventJSON: AppSyncResolverEvent<PublishProductArgs> = {
  arguments: {
    input: {
      id: '111',
    },
  },
  source: null,
  request: { headers: {}, domainName: null },
  info: {
    selectionSetList: [],
    selectionSetGraphQL: '',
    parentTypeName: 'mutation',
    fieldName: 'publishProduct',
    variables: {},
  },
  prev: null,
  stash: {},
}

test('verify happy path 200', async () => {
  const result = await handler(eventJSON)
  console.log('result', result)
})
