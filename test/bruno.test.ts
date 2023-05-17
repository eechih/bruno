// import * as cdk from 'aws-cdk-lib';
// import { Template } from 'aws-cdk-lib/assertions';
// import * as Bruno from '../lib/bruno-stack';

// example test. To run these tests, uncomment this file along with the
// example resource in lib/bruno-stack.ts
test('SQS Queue Created', () => {
  //   const app = new cdk.App();
  //     // WHEN
  //   const stack = new Bruno.BrunoStack(app, 'MyTestStack');
  //     // THEN
  //   const template = Template.fromStack(stack);
  //   template.hasResourceProperties('AWS::SQS::Queue', {
  //     VisibilityTimeout: 300
  //   });

  const serialNum = Math.floor(Math.random() * 1000000)
  console.log('serialNum', serialNum)
})
