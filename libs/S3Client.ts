import {
  S3Client as AWSS3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

type S3ClientConfig = {
  region: string
  bucketName: string
}

export default class S3Client {
  private client: AWSS3Client
  private bucketName: string

  constructor(config: S3ClientConfig) {
    const { region, bucketName } = config
    if (!region || !bucketName) {
      throw new Error(
        `Invalid S3ClientConfig ${JSON.stringify(config, null, 2)}`
      )
    }
    this.bucketName = bucketName
    this.client = new AWSS3Client({ region })
  }

  async getObject(params: { key: string }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: params.key,
    })
    const result = await this.client.send(command)
    return result.Body?.transformToString() ?? ''
  }

  async putObject(params: { key: string; body: string }) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: params.key,
      Body: params.body,
    })
    await this.client.send(command)
  }

  async getPresignedUrl(params: {
    key: string
    expiresIn?: number
  }): Promise<string> {
    const { key, expiresIn = 60 } = params
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })
    return getSignedUrl(this.client, command, { expiresIn })
  }
}
