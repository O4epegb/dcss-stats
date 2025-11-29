import cors from '@fastify/cors'
// import { fastifyOtelInstrumentation } from '~/telemetry'
import { app } from './app'
import { chartRoute } from './routes/charts'
import { devRoute } from './routes/dev'
import { gamesRoute } from './routes/games'
import { logfilesRoute } from './routes/logfiles'
import { mainRoute } from './routes/main'
import { matrixRoute } from './routes/matrix'
import { playersRoute } from './routes/players'
import { searchRoute } from './routes/search'
import { serversRoute } from './routes/servers'
import { staticDataRoute } from './routes/static-data'
import { streaksRoute } from './routes/streaks'
import { streamsRoute } from './routes/streams'
import { suggestRoute } from './routes/suggest'
import { supportersRoute } from './routes/supporters'
import { topRoute } from './routes/top'
import { initSwagger } from './swagger'

export * from './app'

// if (process.env.ENABLE_OTEL) {
// // Seems like it's needed with registerOnInitialization: true
// // Keeping for now just in case
//   await app.register(fastifyOtelInstrumentation.plugin())
// }

app.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET'],
})

for (const route of [
  initSwagger,
  mainRoute,
  topRoute,
  logfilesRoute,
  serversRoute,
  staticDataRoute,
  suggestRoute,
  matrixRoute,
  searchRoute,
  gamesRoute,
  playersRoute,
  streamsRoute,
  supportersRoute,
  chartRoute,
  streaksRoute,
  devRoute,
] as const) {
  await route(app)
}
