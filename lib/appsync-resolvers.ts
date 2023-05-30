import * as appsync from 'aws-cdk-lib/aws-appsync'
import { join } from 'path'

import { toPascalCase } from '../utils/string-util'

const createResolver = (props: {
  api: appsync.IGraphqlApi
  dataSource: appsync.DynamoDbDataSource
  typeName: 'Mutation' | 'Query'
  fieldName: string
  resolverFilename: string
}) => {
  const { api, dataSource, typeName, fieldName, resolverFilename } = props
  const pipelineReqResCode = appsync.Code.fromAsset(
    join(__dirname, '..', 'appsync', 'resolvers', 'pipeline-req-res.js')
  )

  const createProductFunction = dataSource.createFunction(
    `${toPascalCase(fieldName)}Function`,
    {
      name: `${toPascalCase(fieldName)}Function`,
      code: appsync.Code.fromAsset(
        join(__dirname, '..', 'appsync', 'resolvers', resolverFilename)
      ),
      runtime: appsync.FunctionRuntime.JS_1_0_0,
    }
  )

  api.createResolver(`${toPascalCase(fieldName)}Resolver`, {
    typeName: typeName,
    fieldName: fieldName,
    code: pipelineReqResCode,
    runtime: appsync.FunctionRuntime.JS_1_0_0,
    pipelineConfig: [createProductFunction],
  })
}

export function createProductResolvers(
  api: appsync.IGraphqlApi,
  dataSource: appsync.DynamoDbDataSource
) {
  createResolver({
    api,
    dataSource,
    typeName: 'Mutation',
    fieldName: 'createProduct',
    resolverFilename: 'mutation-create-product.js',
  })

  dataSource.createResolver('GetProductResolver', {
    typeName: 'Query',
    fieldName: 'getProduct',
    requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('id', 'id'),
    responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
  })

  dataSource.createResolver('ListProductResolver', {
    typeName: 'Query',
    fieldName: 'listProducts',
    requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
    responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
  })

  dataSource.createResolver('UpdateProductResolver', {
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

  dataSource.createResolver('DeleteProductResolver', {
    typeName: 'Mutation',
    fieldName: 'deleteProduct',
    requestMappingTemplate: appsync.MappingTemplate.dynamoDbDeleteItem(
      'id',
      'input.id'
    ),
    responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
  })
}
