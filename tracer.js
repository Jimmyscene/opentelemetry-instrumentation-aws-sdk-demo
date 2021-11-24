const { KoaInstrumentation } = require('@opentelemetry/instrumentation-koa');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { AwsInstrumentation } = require('@opentelemetry/instrumentation-aws-sdk');

const api = require('@opentelemetry/api');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// api.diag.setLogger(new api.DiagConsoleLogger(), api.DiagLogLevel.DEBUG);

module.exports = (serviceName) => {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),

  });

  const exporter = new JaegerExporter({ host: 'localhost', serviceName, endpoint: 'http://localhost:14268/api/traces' });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

  registerInstrumentations({
    instrumentations: [
      new KoaInstrumentation(),
      new HttpInstrumentation(),
      new AwsInstrumentation({ sqsExtractContextPropagationFromPayload: true }),
    ],
    tracerProvider: provider,
  });

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register();
  console.log('tracing loaded');

  return api.trace.getTracer(serviceName);
};
