import cors from '@fastify/cors'
import { app } from './app'
import { chartRoute } from './routes/charts'
import { devRoute } from './routes/dev'
import { gamesRoute } from './routes/games'
import { logfilesRoute } from './routes/logfiles'
import { playersRoute } from './routes/players'
import { searchRoute } from './routes/search'
import { serversRoute } from './routes/servers'
import { staticDataRoute } from './routes/static-data'
import { statsRoute } from './routes/stats'
import { streamsRoute } from './routes/streams'
import { suggestRoute } from './routes/suggest'
import { supportersRoute } from './routes/supporters'
import { initSwagger } from './swagger'

export * from './app'

app.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET'],
})

for (const route of [
  initSwagger,
  statsRoute,
  logfilesRoute,
  serversRoute,
  staticDataRoute,
  suggestRoute,
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
