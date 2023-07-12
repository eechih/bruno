import {
  MessageAttributeValue,
  SQSClient,
  SendMessageCommand,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs'

type ClientConfig = {
  region: string
  queueUrl: string
}

export default class Client {
  private client: SQSClient
  private queueUrl: string

  constructor(config: ClientConfig) {
    const { region, queueUrl } = config
    if (!region || !queueUrl) {
      throw new Error(`Invalid ClientConfig ${JSON.stringify(config, null, 2)}`)
    }
    this.queueUrl = queueUrl
    this.client = new SQSClient({ region })
  }

  async sendMessage(params: {
    attributes?: Record<string, MessageAttributeValue>
    body?: string
    delaySeconds?: number
  }): Promise<SendMessageCommandOutput> {
    const { attributes, body, delaySeconds = 0 } = params
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      DelaySeconds: delaySeconds,
      MessageAttributes: attributes,
      MessageBody: body,
    })
    const response = await this.client.send(command)
    console.log(response)
    return response
  }
}
