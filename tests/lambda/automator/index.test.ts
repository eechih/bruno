import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { sdkStreamMixin } from '@aws-sdk/util-stream-node'
import { mockClient } from 'aws-sdk-client-mock'
import 'aws-sdk-client-mock-jest'
import axios from 'axios'
import { Readable } from 'stream'

import cookieJson1 from '../../../cookies/cookie.json'
import cookieJson2 from '../../../cookies/cookie2.json'
import { publishProduct } from '../../../lambda/automator'
import { PublishProductArgs } from '../../../lambda/automator/types'
import S3ClientWrapper from '../../../libs/S3Client'
import { mockOwner, mockProduct, mockSettings } from './mock-data'

const ddbMock = mockClient(DynamoDBDocumentClient)
const s3Mock = mockClient(S3Client)

beforeEach(() => {
  ddbMock.reset()
  s3Mock.reset()
})

test.skip('download imag', async () => {
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

  const getPresignedUrlSpy = jest
    .spyOn(S3ClientWrapper.prototype, 'getPresignedUrl')
    .mockResolvedValue(
      'https://thepublicvoice.org/wp-content/uploads/2019/10/TPV-people-hp.jpg'
    )

  ddbMock.on(GetCommand, { TableName: 'mock_product_table_name' }).resolves({
    Item: mockProduct,
  })

  ddbMock.on(GetCommand, { TableName: 'mock_settings_table_name' }).resolves({
    Item: mockSettings,
  })

  const args: PublishProductArgs = {
    input: { id: mockProduct.id },
  }
  const result = await publishProduct(args, mockOwner)
  expect(result).toEqual(mockProduct)
  expect(ddbMock).toHaveReceivedCommandTimes(GetCommand, 2)
  expect(getPresignedUrlSpy).toHaveBeenCalled()
}, 60000)
