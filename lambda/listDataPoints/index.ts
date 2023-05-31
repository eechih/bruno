import { AppSyncResolverEvent } from 'aws-lambda'

const listDataPoints = async () => {
  const items: string[] = []
  const nextToken = undefined
  return { items, nextToken }
}

type TArguments = {
  name: string
}

type TSource = {
  name: string
}

exports.handler = async (event: AppSyncResolverEvent<TArguments, TSource>) => {
  console.log('request:', JSON.stringify(event, undefined, 2))
  const { arguments: args, info } = event
  if (info.fieldName === 'listDataPoints') {
    return await listDataPoints()
  }
  return null
}
