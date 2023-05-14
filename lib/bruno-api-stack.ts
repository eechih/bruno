import * as cdk from 'aws-cdk-lib'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as ddb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { join } from 'path'

export class BrunoApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const api = new appsync.GraphqlApi(this, 'Api', {
      name: 'bruno-appsync-api',
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

    const notesLambda = new lambda.Function(this, 'AppSyncNotesHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset(
        join(__dirname, '..', 'function', 'lambda-fns')
      ),
      memorySize: 1024,
    })

    // set the new Lambda function as a data source for the AppSync API
    const lambdaDs = api.addLambdaDataSource('lambdaDatasource', notesLambda)

    // create resolvers to match GraphQL operations in schema
    lambdaDs.createResolver('getNoteById', {
      typeName: 'Query',
      fieldName: 'getNoteById',
    })

    lambdaDs.createResolver('listNotes', {
      typeName: 'Query',
      fieldName: 'listNotes',
    })

    lambdaDs.createResolver('createNote', {
      typeName: 'Mutation',
      fieldName: 'createNote',
    })

    lambdaDs.createResolver('deleteNote', {
      typeName: 'Mutation',
      fieldName: 'deleteNote',
    })

    lambdaDs.createResolver('updateNote', {
      typeName: 'Mutation',
      fieldName: 'updateNote',
    })

    // create DynamoDB table
    const notesTable = new ddb.Table(this, 'CDKNotesTable', {
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING,
      },
    })

    // enable the Lambda function to access the DynamoDB table (using IAM)
    notesTable.grantFullAccess(notesLambda)

    notesLambda.addEnvironment('NOTES_TABLE', notesTable.tableName)
  }
}
