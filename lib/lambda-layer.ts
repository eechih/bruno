import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import { join } from 'path'

const layersDir = join(__dirname, '..', 'layers')

export default class LambdaLayer extends Construct {
  public readonly chromium: lambda.LayerVersion

  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.chromium = new lambda.LayerVersion(this, 'Chromium', {
      code: lambda.Code.fromAsset(join(layersDir, 'chromium')),
      layerVersionName: 'chromium',
      description: 'Chromium v113',
      compatibleArchitectures: [lambda.Architecture.X86_64],
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_14_X,
        lambda.Runtime.NODEJS_16_X,
        lambda.Runtime.NODEJS_18_X,
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
  }
}
