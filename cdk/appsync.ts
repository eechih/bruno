import { CfnOutput, Duration, Expiration, Fn } from 'aws-cdk-lib'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { join } from 'path'

import { toPascalCase } from '../utils/string-util'

const appsyncDir = join(__dirname, '..', 'appsync')

type AppSyncProps = {
  domain: string
  subdomain: string
  userPool: cognito.IUserPool
  automatorHandler: lambda.IFunction
  productHandler: lambda.IFunction
  settingsHandler: lambda.IFunction
}

function createResolver(
  typeName: 'Mutation' | 'Query',
  fieldName: string,
  lambdaSource: appsync.LambdaDataSource
): appsync.Resolver {
  const id = toPascalCase(fieldName + 'Resolver')
  return lambdaSource.createResolver(id, {
    typeName,
    fieldName,
  })
}
export default class AppSync extends Construct {
  public readonly graphqlApi: appsync.GraphqlApi
  public readonly graphqlCustomEndpoint: string

  constructor(scope: Construct, id: string, props: AppSyncProps) {
    super(scope, id)
    const { userPool, domain, subdomain = 'api' } = props

    // 1. Define AppSync API
    this.graphqlApi = new appsync.GraphqlApi(this, 'QraphQLAPI', {
      name: 'bruno-api',
      schema: appsync.SchemaFile.fromAsset(join(appsyncDir, 'schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.API_KEY,
            apiKeyConfig: {
              expires: Expiration.after(Duration.days(364)),
            },
          },
        ],
      },
      xrayEnabled: true,
      logConfig: {
        excludeVerboseContent: false,
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    })

    // 2. Configuring custom domain name
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: domain,
    })

    const domainName = subdomain + '.' + domain

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(zone),
    })

    new CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
    })

    const appsyncDomainName = new appsync.CfnDomainName(
      this,
      'AppsyncDomainName',
      {
        certificateArn: certificate.certificateArn,
        domainName: domainName,
      }
    )

    new appsync.CfnDomainNameApiAssociation(this, 'DomainNameApiAssociation', {
      apiId: this.graphqlApi.apiId,
      domainName: appsyncDomainName.attrDomainName,
    })

    // Add record
    new route53.CnameRecord(this, 'CnameRecord', {
      recordName: domainName,
      domainName: Fn.select(2, Fn.split('/', this.graphqlApi.graphqlUrl)),
      zone,
    })

    this.graphqlCustomEndpoint = `https://${domainName}/graphql`

    // 3. Set up datasources
    const productLambdaSource = this.graphqlApi.addLambdaDataSource(
      'ProductLambdaSource',
      props.productHandler
    )
    const automatorLambdaSource = this.graphqlApi.addLambdaDataSource(
      'AutomatorLambdaSource',
      props.automatorHandler
    )
    const settingsLambdaSource = this.graphqlApi.addLambdaDataSource(
      'SettingsLambdaSource',
      props.settingsHandler
    )

    // 4. Define resolvers
    createResolver('Mutation', 'updateFBCookie', settingsLambdaSource)
    createResolver('Mutation', 'updateBP1Cookie', settingsLambdaSource)
    createResolver('Mutation', 'createProduct', productLambdaSource)
    createResolver('Mutation', 'updateProduct', productLambdaSource)
    createResolver('Mutation', 'deleteProduct', productLambdaSource)
    createResolver('Mutation', 'publishProduct', automatorLambdaSource)

    createResolver('Query', 'getSettings', settingsLambdaSource)
    createResolver('Query', 'getProduct', productLambdaSource)
    createResolver('Query', 'listProducts', productLambdaSource)
  }
}
