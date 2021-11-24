# opentelemetry aws-sdk instrumentation demo

This repo exists to demonstrate a potential issue with the aws-sdk-instrumentation

# Setup steps

Start Jaeger and localstack with docker compose

1. docker-compose up -d 
Run setup to create queues, topics, and subscriptions
2. npm run setup
Start Servers
3. npm run consumer:start
4. npm run producer:start
Trigger SNS Topic Publish
5. npm run producer:work
Triger SQS Topic Processing
6. npm run consumer:work


From here, the consumer should log out both the producer and consumer's jaeger trace Urls. Upon visiting, one would expect links to appear, however, none do