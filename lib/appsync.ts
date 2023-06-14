import { CfnOutput, Duration, Expiration, Fn } from 'aws-cdk-lib'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { join } from 'path'

const appsyncDir = join(__dirname, '..', 'appsync')
const resolversDir = join(appsyncDir, 'resolvers')
const lambdaDir = join(__dirname, '..', 'lambda')
const depsLockFilePath = join(__dirname, '..', 'pnpm-lock.yaml')

type AppSyncProps = {
  domain: string
  subdomain: string
  userPool: cognito.IUserPool
  productTable: dynamodb.ITable
  dataPointTable: dynamodb.ITable
  chromiumLayer: lambda.ILayerVersion
  bucket: s3.IBucket
}

export default class AppSync extends Construct {
  public readonly graphqlApi: appsync.GraphqlApi
  public readonly graphqlCustomEndpoint: string

  private readonly productTable: dynamodb.ITable
  private readonly dataPointTable: dynamodb.ITable

  private readonly noneDataSource: appsync.NoneDataSource
  private readonly productDataSource: appsync.DynamoDbDataSource
  private readonly dataPointDataSource: appsync.DynamoDbDataSource
  private readonly pipelineReqResCode: appsync.Code

  private readonly chromiumLayer: lambda.ILayerVersion
  private readonly bucket: s3.IBucket

  constructor(scope: Construct, id: string, props: AppSyncProps) {
    super(scope, id)
    const { userPool, domain, subdomain = 'api' } = props
    this.productTable = props.productTable
    this.dataPointTable = props.dataPointTable
    this.chromiumLayer = props.chromiumLayer
    this.bucket = props.bucket

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
    this.noneDataSource = this.graphqlApi.addNoneDataSource('NoneDataSource')
    this.dataPointDataSource = this.graphqlApi.addDynamoDbDataSource(
      'DataPointDataSource',
      this.dataPointTable
    )
    this.productDataSource = this.graphqlApi.addDynamoDbDataSource(
      'ProductDataSource',
      this.productTable
    )

    // 4. Define resolvers
    this.pipelineReqResCode = appsync.Code.fromInline(`
      export function request(ctx) {
        return {}
      }

      export function response(ctx) {
        return ctx.prev.result
      }
    `)
    // Mutations:
    this._createResolver_Mutation_createProduct()
    this._createResolver_Mutation_updateProduct()
    this._createResolver_Mutation_deleteProduct()
    this._createResolver_Mutation_createDataPoint()
    // Queries:
    this._createResolver_Query_importPost()
    this._createResolver_Query_getProduct()
    this._createResolver_Query_listProducts()
    this._createResolver_Query_listDataPoints()
    this._createResolver_Query_queryDataPointsByNameAndDateTime()
    // Subscriptions:
    this._createResolver_Subscription_onCreateDataPoint()
  }

  private _createResolver_Mutation_createProduct() {
    const createProductFunction = this.productDataSource.createFunction(
      'CreateProudctFunction',
      {
        name: 'CreateProudctFunction',
        code: appsync.Code.fromAsset(
          join(resolversDir, 'mutationCreateProduct.js')
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    )

    this.graphqlApi.createResolver('CreateProudctResolver', {
      typeName: 'Mutation',
      fieldName: 'createProduct',
      code: this.pipelineReqResCode,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [createProductFunction],
    })
  }

  private _createResolver_Mutation_updateProduct() {
    this.productDataSource.createResolver('UpdateProductResolver', {
      typeName: 'Mutation',
      fieldName: 'updateProduct',
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        join(resolversDir, 'Mutation.updateProduct.req.vtl')
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    })
  }

  private _createResolver_Mutation_deleteProduct() {
    this.productDataSource.createResolver('DeleteProductResolver', {
      typeName: 'Mutation',
      fieldName: 'deleteProduct',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbDeleteItem(
        'id',
        'input.id'
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    })
  }

  private _createResolver_Mutation_createDataPoint() {
    const customAuthorizer = new nodejs.NodejsFunction(
      this,
      'CustomAuthorizer',
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: join(lambdaDir, 'customAuthorizer', 'index.ts'),
        depsLockFilePath: depsLockFilePath,
        bundling: {
          externalModules: [
            'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
          ],
        },
        environment: { ALLOW: 'true' },
      }
    )

    const customAuthSource = this.graphqlApi.addLambdaDataSource(
      'customAuthSource',
      customAuthorizer
    )

    const f1 = customAuthSource.createFunction('f1', {
      name: 'userChecker',
      code: appsync.Code.fromInline(`
        import { util } from '@aws-appsync/utils';
    
        export function request(ctx) {
            return {
                "version" : "2017-02-28",
                "operation": "Invoke",
                "payload": ctx.args
            };
        }
    
        export function response(ctx) {
            if (!ctx.result.allow) {
                util.unauthorized();
            }
            return {};
        }
      `),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    })

    const f2 = this.dataPointDataSource.createFunction(
      'CreateDataPointFunction',
      {
        name: 'CreateDataPointFunction',
        code: appsync.Code.fromAsset(
          join(resolversDir, 'mutationCreateDataPoint.js')
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    )

    this.graphqlApi.createResolver('CreateDataPointPipeline', {
      typeName: 'Mutation',
      fieldName: 'createDataPoint',
      code: this.pipelineReqResCode,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [f1, f2],
    })
  }

  private _createResolver_Query_importPost() {
    const handler = new nodejs.NodejsFunction(this, 'ImportPostHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: join(lambdaDir, 'importPost', 'index.ts'),
      depsLockFilePath: depsLockFilePath,
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
      },
      layers: [this.chromiumLayer],
      memorySize: 1600,
      timeout: Duration.seconds(60),
    })

    this.bucket.grantRead(handler)

    const lambdaSource = this.graphqlApi.addLambdaDataSource(
      'ImportPostLambdaDataSource',
      handler
    )

    lambdaSource.createResolver('ImportPostResolver', {
      typeName: 'Query',
      fieldName: 'importPost',
    })
  }

  private _createResolver_Query_getProduct() {
    this.productDataSource.createResolver('GetProductResolver', {
      typeName: 'Query',
      fieldName: 'getProduct',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem(
        'id',
        'id'
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    })
  }

  private _createResolver_Query_listProducts() {
    const listProductsFunction = this.productDataSource.createFunction(
      'ListProudctsFunction',
      {
        name: 'ListProudctsFunction',
        code: appsync.Code.fromAsset(
          join(resolversDir, 'queryListProducts.js')
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    )
    this.graphqlApi.createResolver('ListProductsResolver', {
      typeName: 'Query',
      fieldName: 'listProducts',
      code: this.pipelineReqResCode,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [listProductsFunction],
    })
  }

  private _createResolver_Query_listDataPoints() {
    const handler = new nodejs.NodejsFunction(this, 'QueryDataHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: join(lambdaDir, 'listDataPoints', 'index.ts'),
      depsLockFilePath: depsLockFilePath,
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      environment: {
        TABLE: this.dataPointTable.tableName,
      },
    })

    this.dataPointTable.grantReadData(handler)

    const lambdaSource = this.graphqlApi.addLambdaDataSource(
      'lambdaQuerySource',
      handler
    )

    lambdaSource.createResolver('ListDataPointsResolver', {
      typeName: 'Query',
      fieldName: 'listDataPoints',
    })
  }

  private _createResolver_Query_queryDataPointsByNameAndDateTime() {
    const queryDataPointsDateTimeFunction =
      this.dataPointDataSource.createFunction(
        'QueryDataPointsDateTimeFunction',
        {
          name: 'QueryDataPointsDateTimeFunction',
          code: appsync.Code.fromAsset(
            join(resolversDir, 'queryDataPointsByNameAndDateTime.js')
          ),
          runtime: appsync.FunctionRuntime.JS_1_0_0,
        }
      )

    this.graphqlApi.createResolver('QueryNameDateTimePipelineResolver', {
      typeName: 'Query',
      fieldName: 'queryDataPointsByNameAndDateTime',
      code: appsync.Code.fromAsset(
        join(resolversDir, 'Query.queryDataPointsByNameAndDateTime.js')
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [queryDataPointsDateTimeFunction],
    })
  }

  private _createResolver_Subscription_onCreateDataPoint() {
    const subscriptionOnCreateDataPoint = this.noneDataSource.createFunction(
      'SubscriptionOnCreateDataPoint',
      {
        name: 'SubscriptionOnCreateDataPoint',
        code: this.pipelineReqResCode,
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    )

    this.graphqlApi.createResolver('OnCreateDataPoint', {
      typeName: 'Subscription',
      fieldName: 'onCreateDataPoint',
      code: appsync.Code.fromAsset(
        join(resolversDir, 'Subscription.onCreateDataPoint.js')
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [subscriptionOnCreateDataPoint],
    })
  }
}
