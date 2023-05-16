import * as cdk from 'aws-cdk-lib'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import { Construct } from 'constructs'
import { join } from 'path'
import Product from './product'

interface BrunoStackProps extends cdk.StackProps {
  readonly domain: string
}

export class BrunoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BrunoStackProps) {
    super(scope, id, props)

    const { domain } = props

    const api = new appsync.GraphqlApi(this, 'GraphqlApi', {
      name: 'bruno-api',
      schema: appsync.SchemaFile.fromAsset(
        join(__dirname, '..', 'api', 'graphql', 'schema.graphql')
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
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: api.graphqlUrl,
    })

    // print out the AppSync API Key to the terminal
    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: api.apiKey || '',
    })

    // print out the stack region
    new cdk.CfnOutput(this, 'Stack Region', {
      value: this.region,
    })

    const product = new Product(this, 'Product', { api })
  }
}
