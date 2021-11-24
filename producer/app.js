/* eslint-ignore-line-order */
require('../tracer')('producer');
const AWS = require('aws-sdk');
const api = require('@opentelemetry/api');
const logger = require('pino')();

// Adding Koa router (if desired)
const router = require('@koa/router')();
const Koa = require('koa');

// Setup koa
const app = new Koa();
const PORT = 9990;

// route definitions
router.post('/produce', async (ctx) => {
  const sns = new AWS.SNS({
    endpoint: 'http://localhost:4566',
    region: 'us-east-1',
  });

  const result = await sns.publish({
    Message: 'opentelemetry-test',
    TopicArn: 'arn:aws:sns:us-east-1:000000000000:opentelemetry-test',
  }).promise();
  const currentSpan = api.trace.getSpan(api.context.active());
  const { traceId } = currentSpan.spanContext();
  logger.info(`traceid: ${traceId}`);
  logger.info(`Jaeger URL: http://localhost:16686/trace/${traceId}`);
  ctx.body = `${result.MessageId}`;
  ctx.status = 200;
});

async function noOp(_, next) {
  logger.info('Sample basic koa middleware');
  return next();
}

async function setUp() {
  app.use(noOp);
  app.use(router.routes());
}

setUp().then(() => {
  app.listen(PORT);
  logger.info(`Listening on http://localhost:${PORT}`);
});
