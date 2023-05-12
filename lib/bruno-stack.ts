import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import Api from "./api";

interface BrunoStackProps extends cdk.StackProps {
  readonly domain: string;
}

export class BrunoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BrunoStackProps) {
    super(scope, id, props);

    const { domain } = props;

    const api = new Api(this, "Api", {
      domain: domain,
      subdomain: "api",
      routeHandlers: [],
    });
  }
}
