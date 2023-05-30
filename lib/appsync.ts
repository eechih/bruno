import * as cdk from 'aws-cdk-lib'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import { Construct } from 'constructs'
import { join } from 'path'

export const createQraphQLAPI = (scope: Construct, id: string) => {
  const api = new appsync.GraphqlApi(scope, id, {
    name: 'bruno-api',
    schema: appsync.SchemaFile.fromAsset(
      join(__dirname, '..', 'appsync', 'schema.graphql')
    ),
    authorizationConfig: {
      defaultAuthorization: {
        authorizationType: appsync.AuthorizationType.API_KEY,
        apiKeyConfig: {
          expires: cdk.Expiration.after(cdk.Duration.days(365)),
        },
      },
    },
    xrayEnabled: true,
  })

  // print out the AppSync GraphQL endpoint to the terminal
  new cdk.CfnOutput(scope, 'GraphQLAPIURL', {
    value: api.graphqlUrl,
  })

  // print out the AppSync API Key to the terminal
  new cdk.CfnOutput(scope, 'GraphQLAPIKey', {
    value: api.apiKey || '',
  })
  return api
}
