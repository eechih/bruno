import * as cdk from 'aws-cdk-lib'
import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { join } from 'path'

const appsyncDir = join(__dirname, '..', 'appsync')
const resolversDir = join(appsyncDir, 'resolvers')
const lambdaDir = join(__dirname, '..', 'lambda')

type AppSyncProps = {
  userPool: cognito.IUserPool
  productTable: dynamodb.ITable
  dataPointTable: dynamodb.ITable
}

export default class AppSync extends Construct {
  public readonly graphqlApi: appsync.GraphqlApi

  private readonly productTable: dynamodb.ITable
  private readonly dataPointTable: dynamodb.ITable

  private readonly noneDataSource: appsync.NoneDataSource
  private readonly productDataSource: appsync.DynamoDbDataSource
  private readonly dataPointDataSource: appsync.DynamoDbDataSource
  private readonly pipelineReqResCode: appsync.Code

  constructor(scope: Construct, id: string, props: AppSyncProps) {
    super(scope, id)
    const { userPool } = props
    this.productTable = props.productTable
    this.dataPointTable = props.dataPointTable

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
              expires: cdk.Expiration.after(cdk.Duration.days(365)),
            },
          },
        ],
      },
      xrayEnabled: true,
    })

    // Outputs
    new cdk.CfnOutput(this, 'GraphQLAPI_ID', {
      value: this.graphqlApi.apiId,
    })
    new cdk.CfnOutput(this, 'GraphQLAPI_URL', {
      value: this.graphqlApi.graphqlUrl,
    })
    new cdk.CfnOutput(this, 'GraphQLAPI_KEY', {
      value: this.graphqlApi.apiKey || '',
    })

    // 2. Set up a dummy Datasource
    this.noneDataSource = this.graphqlApi.addNoneDataSource('NoneDataSource')

    // 3. Set up table as a Datasource and grant access
    this.dataPointDataSource = this.graphqlApi.addDynamoDbDataSource(
      'DataPointDataSource',
      this.dataPointTable
    )
    this.productDataSource = this.graphqlApi.addDynamoDbDataSource(
      'ProductDataSource',
      this.productTable
    )

    this.pipelineReqResCode = appsync.Code.fromInline(`
      export function request(ctx) {
        return {}
      }

      export function response(ctx) {
        return ctx.prev.result
      }
    `)

    // 4. Define resolvers
    // Mutations:
    this._createResolver_Mutation_createProduct()
    this._createResolver_Mutation_updateProduct()
    this._createResolver_Mutation_deleteProduct()
    this._createResolver_Mutation_createDataPoint()
    // Queries:
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
        join(
          __dirname,
          '..',
          'appsync',
          'resolvers',
          'Mutation.updateProduct.req.vtl'
        )
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
    const createDataPointFunction = this.dataPointDataSource.createFunction(
      'CreateDataPointFunction',
      {
        name: 'CreateDataPointFunction',
        code: appsync.Code.fromAsset(
          join(resolversDir, 'mutationCreateDataPoint.js')
        ),
        runtime: appsync.FunctionRuntime.JS_1_0_0,
      }
    )

    this.graphqlApi.createResolver('CreateDataPointPipelineResolver', {
      typeName: 'Mutation',
      fieldName: 'createDataPoint',
      code: this.pipelineReqResCode,
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      pipelineConfig: [createDataPointFunction],
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
    this.productDataSource.createResolver('ListProductsResolver', {
      typeName: 'Query',
      fieldName: 'listProducts',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    })
  }

  private _createResolver_Query_listDataPoints() {
    const queryHandler = new lambda.Function(this, 'QueryDataHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(join(lambdaDir, 'listDataPoints')),
      handler: 'index.handler',
      environment: {
        TABLE: this.dataPointTable.tableName,
      },
    })
    this.dataPointTable.grantReadData(queryHandler)

    const lambdaSource = this.graphqlApi.addLambdaDataSource(
      'lambdaQuerySource',
      queryHandler
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
