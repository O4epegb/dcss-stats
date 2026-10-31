import FastifyOtelInstrumentation from '@fastify/otel'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

if (process.env.ENABLE_OTEL === 'true') {
  const metricsPort = 9464
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'dcss-stats-backend',
    }),
    metricReaders: [new PrometheusExporter({ port: metricsPort })],
    // The app exports metrics only; do not initialize the default OTLP exporters.
    spanProcessors: [],
    logRecordProcessors: [],
    instrumentations: [
      new HttpInstrumentation({
        // Scraping the exporter must not count as an application request.
        ignoreIncomingRequestHook: (request) => request.socket.localPort === metricsPort,
      }),
      // Supplies route templates to HTTP metrics without wrapping every handler/hook.
      new FastifyOtelInstrumentation({
        registerOnInitialization: true,
        instrumentHandler: false,
        instrumentHooks: false,
      }),
    ],
  })

  sdk.start()
}
