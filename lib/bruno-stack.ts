import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import Api from './api'
import Product from './product'

interface BrunoStackProps extends cdk.StackProps {
  readonly domain: string
}

export class BrunoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BrunoStackProps) {
    super(scope, id, props)

    const { domain } = props

    const product = new Product(this, 'Product')

    const api = new Api(this, 'Api', {
      domain: domain,
      subdomain: 'brunoapi',
      routeHandlers: [{ routePath: '/products', handler: product.handler }],
    })
  }
}
