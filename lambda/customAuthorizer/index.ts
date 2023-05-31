import { AppSyncAuthorizerEvent } from 'aws-lambda'

exports.handler = async (event: AppSyncAuthorizerEvent) => {
  console.log('request:', JSON.stringify(event, undefined, 2))
  if (process.env.ALLOW === 'true') {
    return { allow: true }
  } else {
    return { allow: false }
  }
}
