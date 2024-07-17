import { PrismaClient } from '@prisma/client'
import { data } from './seedData'

const prisma = new PrismaClient()

async function main() {
  for (const server of data.servers) {
    const data = {
      name: server.name,
      abbreviation: server.abbreviation,
      url: server.url,
      baseUrl: server.baseUrl,
      morgueUrl: server.morgueUrl,
    }
    const s = await prisma.server.upsert({
      create: data,
      update: data,
      where: {
        name: server.name,
      },
    })

    await Promise.all(
      server.logfiles.map((logfile) => {
        return prisma.logfile.upsert({
          create: {
            path: logfile.path,
            version: logfile.version,
            serverId: s.id,
            morgueUrlPrefix: logfile.morgueUrlPrefix,
          },
          update: {
            morgueUrlPrefix: logfile.morgueUrlPrefix,
          },
          where: {
            serverId_path: {
              serverId: s.id,
              path: logfile.path,
            },
          },
        })
      }),
    )
  }

  await prisma.race.deleteMany()
  await prisma.class.deleteMany()

  await Promise.all([
    prisma.race.createMany({
      data: data.races.map(([abbr, name, trunk = true]) => ({
        abbr,
        name,
        trunk,
      })),
      skipDuplicates: true,
    }),
    prisma.class.createMany({
      data: data.classes.map(([abbr, name, trunk = true]) => ({
        abbr,
        name,
        trunk,
      })),
      skipDuplicates: true,
    }),
    prisma.god.createMany({
      data: data.gods.map((name) => ({ name })),
      skipDuplicates: true,
    }),
  ])

  await prisma.player.updateMany({
    where: {
      name: {
        in: data.bots.slice(),
        mode: 'insensitive',
      },
    },
    data: {
      isBot: true,
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
