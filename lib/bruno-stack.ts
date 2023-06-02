import * as cdk from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import AppSync from './appsync'
import CognitoAuthRole from './cognito-auth-role'
import CognitoUnuthRole from './cognito-unauth-role'
import { createGenericDataPointTable, createProductTable } from './dynamodb'
import LambdaLayer from './lambda-layer'
// import WafConfig from './waf-config'

interface BrunoStackProps extends cdk.StackProps {
  readonly domain: string
}

export class BrunoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BrunoStackProps) {
    super(scope, id, props)

    cdk.Tags.of(this).add('user:Application', 'bruno')
    cdk.Tags.of(this).add('user:Stack', 'dev')

    const { domain } = props

    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true, // Allow users to sign up
      autoVerify: { email: true }, // Verify email addresses by sending a verification code
      signInAliases: { email: true }, // Set email as an alias
    })

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false, // Don't need to generate secret for web app running on browsers
    })

    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false, // Don't allow unathenticated users
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    })

    // Export values
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    })
    new cdk.CfnOutput(this, 'UserPoolWebClientId', {
      value: userPoolClient.userPoolClientId,
    })
    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref,
    })

    // Create S3 Bucket
    const bucket = new s3.Bucket(this, 'Bucket', {
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'],
          exposedHeaders: [
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2',
            'ETag',
          ],
          maxAge: 3000,
        },
      ],
    })

    // print out the S3 Bucket name to the terminal
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
    })

    const authenticatedRole = new CognitoAuthRole(this, 'AuthenticatedRole', {
      identityPool,
      bucket,
    })

    const unauthenticatedRole = new CognitoUnuthRole(
      this,
      'UnauthenticatedRole',
      {
        identityPool,
      }
    )

    // refer to https://github.com/bobbyhadz/cdk-identity-pool-example/blob/cdk-v2/lib/cdk-starter-stack.ts
    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      'identity-pool-role-attachment',
      {
        identityPoolId: identityPool.ref,
        roles: {
          authenticated: authenticatedRole.role.roleArn,
          unauthenticated: unauthenticatedRole.role.roleArn,
        },
        roleMappings: {
          mapping: {
            type: 'Token',
            ambiguousRoleResolution: 'AuthenticatedRole',
            identityProvider: `cognito-idp.${
              cdk.Stack.of(this).region
            }.amazonaws.com/${userPool.userPoolId}:${
              userPoolClient.userPoolClientId
            }`,
          },
        },
      }
    )

    const { chromium } = new LambdaLayer(this, 'LambdaLayer')

    const productTable = createProductTable(this)
    const dataPointTable = createGenericDataPointTable(this)

    const appsync = new AppSync(this, 'AppSync', {
      domain,
      subdomain: 'brunoapi',
      userPool,
      productTable,
      dataPointTable,
      chromiumLayer: chromium,
      bucket: bucket,
    })

    new cdk.CfnOutput(this, 'GraphqlCustomEndpoint', {
      value: appsync.graphqlCustomEndpoint,
    })

    new cdk.CfnOutput(this, 'GraphqlEndpoint', {
      value: appsync.graphqlApi.graphqlUrl,
    })

    new cdk.CfnOutput(this, 'GraphqlApiId', {
      value: appsync.graphqlApi.apiId,
    })

    new cdk.CfnOutput(this, 'GraphqlApiKey', {
      value: appsync.graphqlApi.apiKey || '',
    })

    // new WafConfig(this, 'BrunoAPI-waf', { graphqlApi: appsync.graphqlApi })
  }
}
