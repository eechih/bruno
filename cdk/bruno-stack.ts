import * as cdk from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

import AppSync from './appsync'
import Automator from './automator'
import Buyplus1 from './buyplus1'
import CognitoAuthRole from './cognito-auth-role'
import CognitoUnuthRole from './cognito-unauth-role'
import Cookie from './cookie'
import LambdaLayer from './lambda-layer'
import Product from './product'
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
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    const OAUTH_SCOPES: cognito.OAuthScope[] = [
      cognito.OAuthScope.EMAIL,
      cognito.OAuthScope.OPENID,
      cognito.OAuthScope.PROFILE,
      cognito.OAuthScope.COGNITO_ADMIN,
    ]

    const CALLBACK_URL = 'http://localhost:3000/api/auth/callback/cognito'

    const userPoolClientProps = {
      userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
        custom: true,
      },
      oAuth: {
        callbackUrls: [CALLBACK_URL],
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.COGNITO_ADMIN,
        ],
      },
    }

    const userPoolClient = new cognito.UserPoolClient(
      this,
      'UserPoolClient',
      userPoolClientProps
    )

    const userPoolWebClient = new cognito.UserPoolClient(
      this,
      'UserPoolWebClient',
      {
        ...userPoolClientProps,
        generateSecret: true,
      }
    )

    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false, // Don't allow unathenticated users
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
        {
          clientId: userPoolWebClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    })

    const userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
      userPool: userPool,
      cognitoDomain: {
        domainPrefix: 'bruno',
      },
    })

    userPoolDomain.domainName

    // Export values
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    })
    new cdk.CfnOutput(this, 'UserPoolWebClientId', {
      value: userPoolWebClient.userPoolClientId,
    })
    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref,
    })
    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: userPoolDomain.domainName,
    })
    new cdk.CfnOutput(this, 'LoginUrl', {
      value: userPoolDomain.signInUrl(userPoolWebClient, {
        redirectUri: CALLBACK_URL,
      }),
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

    const product = new Product(this, 'Product')

    const cookie = new Cookie(this, 'Cookie')

    const automator = new Automator(this, 'Automator', {
      layers: [chromium],
      productTable: product.table,
      cookieTable: cookie.table,
      bucket: bucket,
    })

    const buyplus1 = new Buyplus1(this, 'Buyplus1', {
      layers: [chromium],
      productTable: product.table,
      bucket: bucket,
    })

    const appsync = new AppSync(this, 'AppSync', {
      domain,
      subdomain: 'brunoapi',
      userPool,
      productHandler: product.handler,
      cookieHandler: cookie.handler,
      automatorHandler: automator.handler,
      buyplus1Handler: buyplus1.handler,
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
