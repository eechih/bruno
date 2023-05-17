import * as cdk from 'aws-cdk-lib'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { join } from 'path'
import Product from './product'

interface BrunoStackProps extends cdk.StackProps {
  readonly domain: string
}

export class BrunoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BrunoStackProps) {
    super(scope, id, props)

    cdk.Tags.of(this).add('user:Application', 'bruno')
    cdk.Tags.of(this).add('user:Stack', 'dev')

    const { domain } = props

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

    const privatePolicy = new iam.Policy(this, 'PrivatePolicy', {
      policyName: 'Private_policy',
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
          resources: [
            bucket.arnForObjects(
              'private/${cognito-identity.amazonaws.com:sub}/*'
            ),
          ],
          effect: iam.Effect.ALLOW,
        }),
      ],
    })

    const protectedPolicy = new iam.Policy(this, 'ProtectedPolicy', {
      policyName: 'Protected_policy',
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
          resources: [
            bucket.arnForObjects(
              'protected/${cognito-identity.amazonaws.com:sub}/*'
            ),
          ],
          effect: iam.Effect.ALLOW,
        }),
      ],
    })

    const publicPolicy = new iam.Policy(this, 'PublicPolicy', {
      policyName: 'Public_policy',
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
          resources: [bucket.arnForObjects('public/*')],
          effect: iam.Effect.ALLOW,
        }),
      ],
    })

    const readPolicy = new iam.Policy(this, 'ReadPolicy', {
      policyName: 'Read_policy',
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:GetObject'],
          resources: [bucket.arnForObjects('protected/*')],
          effect: iam.Effect.ALLOW,
        }),
        new iam.PolicyStatement({
          actions: ['s3:ListBucket'],
          resources: [bucket.bucketArn],
          effect: iam.Effect.ALLOW,
          conditions: {
            StringLike: {
              's3:prefix': [
                'public/',
                'public/*',
                'protected/',
                'protected/*',
                'private/${cognito-identity.amazonaws.com:sub}/',
                'private/${cognito-identity.amazonaws.com:sub}/*',
              ],
            },
          },
        }),
      ],
    })

    const uploadPolicy = new iam.Policy(this, 'UploadPolicy', {
      policyName: 'Upload_policy',
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:PutObject'],
          resources: [bucket.arnForObjects('uploads/*')],
          effect: iam.Effect.ALLOW,
        }),
      ],
    })

    const authRole = new iam.Role(this, `AuthRole`, {
      roleName: `${this.stackName}-authRole`,
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          // StringEquals: {
          //   'cognito-identity.amazonaws.com:aud':
          //     'us-east-1:e618ee17-69cd-4d6b-9770-6820664a0fce',
          // },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    })
    authRole.attachInlinePolicy(privatePolicy)
    authRole.attachInlinePolicy(protectedPolicy)
    authRole.attachInlinePolicy(publicPolicy)
    authRole.attachInlinePolicy(readPolicy)
    authRole.attachInlinePolicy(uploadPolicy)

    const unauthRole = new iam.Role(this, `UnuthRole`, {
      roleName: `${this.stackName}-unauthRole`,
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com'),
    })

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
