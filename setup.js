const AWS = require('aws-sdk');
const logger = require('pino')();

const sns = new AWS.SNS({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
});

const sqs = new AWS.SQS({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
});

async function main() {
  const { TopicArn } = await sns.createTopic({ Name: 'opentelemetry-test' }).promise();
  logger.info({ TopicArn });
  const { QueueUrl } = await sqs.createQueue({
    QueueName: 'opentelemetry-test',
  }).promise();
  const { Subscriptions } = await sns.listSubscriptionsByTopic({ TopicArn }).promise()
  if (Subscriptions.length > 0) {
    logger.warn(`Unsubscripting existing subscriptions to topic ${TopicArn}`)
    await Promise.all(Subscriptions.map(async subscription => await sns.unsubscribe({ SubscriptionArn: subscription.SubscriptionArn})))
  }

  logger.info({ QueueUrl });
  return sns.subscribe({
    Protocol: 'sqs',
    TopicArn,
    Endpoint: QueueUrl,
  }).promise();
}
main().then(() => logger.info('successfully created resources')).catch((err) => logger.info(err));
