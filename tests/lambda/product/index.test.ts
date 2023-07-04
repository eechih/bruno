import { AppSyncResolverEvent } from 'aws-lambda'
import { handler, PublishProductArgs } from '../../../lambda/product'

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
