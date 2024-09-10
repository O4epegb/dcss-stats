import { AppType } from '~/app/app'
import { prisma } from '~/prisma'

export const logfilesRoute = (app: AppType) => {
  app.get<{
    Params: {
      id: string
    }
  }>('/api/logfiles/:id', async (request, reply) => {
    const logfile = await prisma.logfile.findUnique({
      where: {
        id: request.params.id,
      },
      include: {
        _count: {
          select: {
            game: true,
          },
        },
      },
    })

    if (!logfile) {
      return reply.status(404).send('Not found')
    }

    return {
      data: logfile,
    }
  })
}
