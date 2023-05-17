import {
  AppSyncClient,
  EvaluateMappingTemplateCommand,
} from '@aws-sdk/client-appsync'
import * as fs from 'fs'
import { join } from 'path'

const client = new AppSyncClient({ region: 'us-east-2' })

test('request correctly calls DynamoDB', async () => {
  const template = fs.readFileSync(join(__dirname, 'request.vtl'), 'utf8')
  const context = fs.readFileSync(join(__dirname, 'context.json'), 'utf8')
  const contextJSON = JSON.parse(context)

  const command = new EvaluateMappingTemplateCommand({ template, context })
  const response = await client.send(command)
  const result = JSON.parse(response.evaluationResult ?? '')

  expect(result.key.id.S).toBeDefined()
  expect(result.attributeValues.firstname.S).toEqual(
    contextJSON.arguments.firstname
  )
  expect(result.attributeValues.age.N).toEqual(contextJSON.arguments.age)
})

test('response correctly calls DynamoDB', async () => {
  const template = fs.readFileSync(join(__dirname, 'response.vtl'), 'utf8')
  const context = fs.readFileSync(join(__dirname, 'context.json'), 'utf8')
  const contextJSON = JSON.parse(context)

  const command = new EvaluateMappingTemplateCommand({ template, context })
  const response = await client.send(command)

  console.log(response)
  const result = JSON.parse(response.evaluationResult ?? '')

  expect(result).toEqual(contextJSON.result)
})

test('error response correctly calls DynamoDB', async () => {
  const template = fs.readFileSync(join(__dirname, 'response.vtl'), 'utf8')
  const context = fs.readFileSync(
    join(__dirname, 'context-invalid.json'),
    'utf8'
  )

  const command = new EvaluateMappingTemplateCommand({ template, context })
  const response = await client.send(command)

  expect(response.error).toEqual({ message: 'Unauthorized' })
})
