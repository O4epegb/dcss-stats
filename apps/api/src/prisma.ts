import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

export const prisma = new PrismaClient({
  adapter,
  // log: ['query', 'info', `warn`, `error`],
  // log: [
  //   {
  //     emit: 'event',
  //     level: 'query',
  //   },
  // ],
})

// prisma.$on('query', (e) => {
//   console.log(e.query);
//   console.log('Duration: ' + e.duration + 'ms');
// });

// if (process.env.NODE_ENV !== 'production') {
//   prisma.$use(async (params, next) => {
//     const before = Date.now();

//     const result = await next(params);

//     const after = Date.now();

//     console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);

//     return result;
//   });
// }
