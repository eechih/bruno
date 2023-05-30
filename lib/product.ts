import * as appsync from 'aws-cdk-lib/aws-appsync'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import { join } from 'path'

const resolvers = join(__dirname, '..', 'api', 'graphql', 'resolvers')

type ProductProps = {
  api: appsync.IGraphqlApi
}

export default class Product extends Construct {
  public readonly table: dynamodb.Table

  constructor(scope: Construct, id: string, props: ProductProps) {
    super(scope, id)
    const { api } = props

    this.table = new dynamodb.Table(this, 'Table', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    })

    this.table.addGlobalSecondaryIndex({
      indexName: 'byOwner',
      partitionKey: {
        name: 'owner',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
    })

    const dynamoDbDataSource = api.addDynamoDbDataSource(
      'ProductDataSource',
      this.table
    )

    dynamoDbDataSource.createResolver('GetProductResolver', {
      typeName: 'Query',
      fieldName: 'getProduct',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem(
        'id',
        'id'
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    })

    dynamoDbDataSource.createResolver('ListProductResolver', {
      typeName: 'Query',
      fieldName: 'listProducts',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    })

    dynamoDbDataSource.createResolver('CreateProductResolver', {
      typeName: 'Mutation',
      fieldName: 'createProduct',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbPutItem(
        appsync.PrimaryKey.partition('id').auto(),
        appsync.Values.projecting('input')
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    })

    dynamoDbDataSource.createResolver('UpdateProductResolver', {
      typeName: 'Mutation',
      fieldName: 'updateProduct',
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        join(resolvers, 'Mutation.updateProduct.req.vtl')
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    })

    dynamoDbDataSource.createResolver('DeleteProductResolver', {
      typeName: 'Mutation',
      fieldName: 'deleteProduct',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbDeleteItem(
        'id',
        'input.id'
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    })
  }
}
