import cors from '@fastify/cors'
import { app } from './app'
import { combosRoute } from './routes/combos'
import { devRoute } from './routes/dev'
import { gamesRoute } from './routes/games'
import { logfilesRoute } from './routes/logfiles'
import { playersRoute } from './routes/players'
import { searchRoute } from './routes/search'
import { serversRoute } from './routes/servers'
import { statsRoute } from './routes/stats'
import { streamsRoute } from './routes/streams'
import { suggestRoute } from './routes/suggest'
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
  combosRoute,
  suggestRoute,
  searchRoute,
  gamesRoute,
  playersRoute,
  streamsRoute,
  devRoute,
] as const) {
  await route(app)
}
