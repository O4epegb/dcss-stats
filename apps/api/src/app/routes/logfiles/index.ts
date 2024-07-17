import { prisma } from '~/prisma'
import { AppType } from '~/app/app'

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
