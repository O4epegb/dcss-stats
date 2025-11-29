import './env'
import '~/telemetry'
import Bugsnag from '@bugsnag/js'
import { app } from './app'
import { startParsing } from './parser'
import { prisma } from './prisma'

if (process.env.NODE_ENV === 'production') {
  Bugsnag.start({ apiKey: 'c271cd93546079ad2c31ab64c35733a7' })
}

async function main() {
  try {
    await app.listen({
      port: 1444,
      host: '0.0.0.0',
    })

    app.swagger()

    startParsing()
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main().finally(async () => {
  await prisma.$disconnect()
})

if (process.env.TS_NODE_DEV) {
  process.on('SIGTERM', () => {
    process.exit(1)
  })
}
