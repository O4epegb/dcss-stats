import cors from '@fastify/cors'
import { app } from './app'
import { statsRoute } from './routes/stats'
import { logfilesRoute } from './routes/logfiles'
import { serversRoute } from './routes/servers'
import { combosRoute } from './routes/combos'
import { suggestRoute } from './routes/suggest'
import { devRoute } from './routes/dev'
import { searchRoute } from './routes/search'
import { gamesRoute } from './routes/games'
import { playersRoute } from './routes/players'
import { streamsRoute } from './routes/streams'

export * from './app'

app.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET'],
})

statsRoute(app)
logfilesRoute(app)
serversRoute(app)
combosRoute(app)
suggestRoute(app)
searchRoute(app)
gamesRoute(app)
playersRoute(app)
streamsRoute(app)
devRoute(app)
