/* eslint-ignore-line-order */
require('../tracer')('consumer');

const AWS = require('aws-sdk');
const api = require('@opentelemetry/api');
// Adding Koa router (if desired)
const router = require('@koa/router')();
const Koa = require('koa');
const { SpanKind } = require('@opentelemetry/api');
const logger = require('pino')();

// Setup koa
const app = new Koa();
const PORT = 9991;

async function consume(ctx) {
  const sqs = new AWS.SQS({
    endpoint: 'http://localhost:4566',
    region: 'us-east-1',
  });
  const message = await sqs.receiveMessage({
    QueueUrl: 'http://localhost:4566/000000000000/opentelemetry-test',
  }).promise();
  const zipped = message.Messages.map((message) => [message, JSON.parse(message.Body).MessageAttributes.traceparent.Value])
  for (const [message, id] of zipped) {
    const { traceId, spanId } = id.match(/\d{2}-(?<traceId>\S{32})-(?<spanId>\S{16})-\d{2}/)?.groups
    console.log({ traceId, spanId, message })
    const span = api.trace.getTracer().startSpan(`process ${id}`, {
      kind: SpanKind.CONSUMER,
      links: [
        {
          context: {
            spanId, traceId, isRemote: true
          }
        }
      ]
    }, api.context.active())
    const newContext = api.trace.setSpan(api.context.active(), span)
    api.context.with(newContext, () => {
      logger.info("Proccessing ${id}")
    })
    span.end()
    logger.info(`Parent Jaeger URL: http://localhost:16686/trace/${traceId}`);
    logger.info(`Child Jaeger URL: http://localhost:16686/trace/${span.spanContext().traceId}`);
  }

  ctx.body = `${JSON.stringify(message.Messages.length)}`;
}

// route definitions
router.post('/consume', consume);

async function noOp(_, next) {
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
