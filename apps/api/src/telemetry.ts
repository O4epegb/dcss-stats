import FastifyOtelInstrumentation from '@fastify/otel'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
// import {
//   // ConsoleSpanExporter,
//   // SimpleSpanProcessor,
//   // BatchSpanProcessor,
// } from '@opentelemetry/sdk-trace-base'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

// const traceExporter = new ConsoleSpanExporter()
// const spanProcessor = new SimpleSpanProcessor(traceExporter)
// const spanProcessor = new BatchSpanProcessor(traceExporter)

if (process.env.ENABLE_OTEL) {
  const fastifyOtelInstrumentation = new FastifyOtelInstrumentation({
    registerOnInitialization: true,
  })

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      // This can also be set by OTEL_SERVICE_NAME
      // Instruments inherit from the SDK resource attributes
      [ATTR_SERVICE_NAME]: 'dcss-stats-backend',
    }),
    metricReader: new PrometheusExporter({ port: 9464 }),
    // traceExporter,
    // spanProcessor,
    instrumentations: [
      // HttpInstrumentation is required for FastifyOtelInstrumentation to work
      new HttpInstrumentation(),
      fastifyOtelInstrumentation,
    ],
  })

  sdk.start()

  let shutdownRequested = false

  async function shutdownTelemetry() {
    if (shutdownRequested) {
      return
    }

    shutdownRequested = true
    await sdk.shutdown()
  }

  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_OTEL) {
    const handleShutdownSignal = () => {
      return shutdownTelemetry().then(
        // eslint-disable-next-line no-console
        () => console.log('SDK shut down successfully'),
        (err) => console.error('Error shutting down SDK', err),
      )
    }

    process.once('SIGTERM', handleShutdownSignal)
    process.once('SIGINT', handleShutdownSignal)
    process.once('beforeExit', handleShutdownSignal)
  }
}
