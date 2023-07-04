import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

type CognitoAuthRoleProps = {
  identityPool: cognito.CfnIdentityPool
  bucket: s3.Bucket
}
export default class CognitoAuthRole extends Construct {
  public readonly role: iam.IRole

  constructor(scope: Construct, id: string, props: CognitoAuthRoleProps) {
    super(scope, id)
    const { identityPool, bucket } = props

    this.role = new iam.Role(this, 'Role', {
      // roleName: `Bruno-authRole`,
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
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

    this.role.attachInlinePolicy(privatePolicy)
    this.role.attachInlinePolicy(protectedPolicy)
    this.role.attachInlinePolicy(publicPolicy)
    this.role.attachInlinePolicy(readPolicy)
    this.role.attachInlinePolicy(uploadPolicy)
  }
}
