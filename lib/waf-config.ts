import * as cdk from 'aws-cdk-lib'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as waf2 from 'aws-cdk-lib/aws-wafv2'
import { Construct } from 'constructs'

type WafConfigProps = {
  graphqlApi: appsync.GraphqlApi
}

export default class WafConfig extends Construct {
  constructor(scope: Construct, id: string, props: WafConfigProps) {
    super(scope, id)
    const { graphqlApi } = props

    const allowedIPSet = new waf2.CfnIPSet(this, 'MyIP', {
      addresses: ['61.216.30.35/32'], // replace with your public IP address
      ipAddressVersion: 'IPV4',
      scope: 'REGIONAL',
      name: 'MyIPSet-AppSyncBruno',
    })

    const acl = new waf2.CfnWebACL(this, 'ACL', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      name: 'BrunoAPI-ACL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: 'BrunoAPI',
      },
      rules: [
        {
          name: 'FloodProtection',
          action: { block: {} },
          priority: 1,
          statement: {
            rateBasedStatement: { aggregateKeyType: 'IP', limit: 1000 },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: 'BrunoAPI-FloodProtection',
          },
        },
        {
          name: 'RestrictAPIKey',
          action: { block: {} },
          priority: 2,
          statement: {
            andStatement: {
              statements: [
                {
                  byteMatchStatement: {
                    fieldToMatch: { singleHeader: { name: 'x-api-key' } },
                    positionalConstraint: 'EXACTLY',
                    searchString: graphqlApi.apiKey,
                    textTransformations: [{ priority: 1, type: 'LOWERCASE' }],
                  },
                },
                {
                  notStatement: {
                    statement: {
                      ipSetReferenceStatement: { arn: allowedIPSet.attrArn },
                    },
                  },
                },
              ],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: 'BrunoAPI-RestrictAPIKey',
          },
        },
      ],
    })

    const association = new waf2.CfnWebACLAssociation(this, 'APIAssoc', {
      resourceArn: graphqlApi.arn,
      webAclArn: acl.attrArn,
    })

    new cdk.CfnOutput(this, 'ACLRef', { value: acl.ref })
    new cdk.CfnOutput(this, 'ACLAPIAssoc', { value: association.ref })
  }
}
