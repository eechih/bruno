import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

type CognitoAuthRoleProps = {
  identityPool: cognito.CfnIdentityPool
}
export default class CognitoAuthRole extends Construct {
  public readonly role: iam.IRole

  constructor(scope: Construct, id: string, props: CognitoAuthRoleProps) {
    super(scope, id)
    const { identityPool } = props

    this.role = new iam.Role(this, 'Role', {
      // roleName: `Bruno-unauthRole`,
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    })
  }
}
