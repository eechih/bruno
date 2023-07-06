import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { sdkStreamMixin } from '@aws-sdk/util-stream-node'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import axios from 'axios'
import { Readable } from 'stream'

import cookieJson1 from '../../../cookies/cookie.json'
import cookieJson2 from '../../../cookies/cookie2.json'
import { publishProduct } from '../../../lambda/buyplus1'
import { Product, PublishProductArgs } from '../../../lambda/buyplus1/types'
import { util } from '../../../utils'

const ddbMock = mockClient(DynamoDBDocumentClient)
const s3Mock = mockClient(S3Client)

beforeEach(() => {
  ddbMock.reset()
  s3Mock.reset()
})

test('download imag', async () => {
  const imageUrl =
    'https://upload.wikimedia.org/wikipedia/commons/b/b6/Image_created_with_a_mobile_phone.png'
  const response = await axios.get(imageUrl, {
    decompress: false,
    responseType: 'arraybuffer',
  })
  const image = response.data
  console.log('image', image)
})
test.skip('should publish product to BuyPlus1', async () => {
  // create Stream from string
  console.log('cookieJson1', cookieJson1)
  console.log('cookieJson2', cookieJson2)
  const stream = new Readable()
  stream.push(JSON.stringify([...cookieJson2]))
  stream.push(null) // end of stream

  // wrap the Stream with SDK mixin
  const sdkStream = sdkStreamMixin(stream)

  s3Mock.on(GetObjectCommand).resolves({
    Body: sdkStream,
  })

  const product: Product = {
    id: 'mock',
    name: 'test by harry',
    description: 'test',
    price: 100,
    cost: 90,
    offShelfAt: util.time.nowISO8601(),
    provider: 'HARRY',
  }

  ddbMock.on(GetCommand).resolves({
    Item: product,
  })

  const args: PublishProductArgs = {
    input: { id: product.id },
  }
  const owner = 'mock'
  const result = await publishProduct(args, owner)
  expect(result).toEqual(product)
  expect(ddbMock).toHaveReceivedCommandTimes(GetCommand, 1)
}, 30000)
