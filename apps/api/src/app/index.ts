import cors from '@fastify/cors'
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
import { streamsRoute } from './routes/streams'
import { suggestRoute } from './routes/suggest'
import { supportersRoute } from './routes/supporters'
import { topRoute } from './routes/top'
import { initSwagger } from './swagger'

export * from './app'

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
  devRoute,
] as const) {
  await route(app)
}
