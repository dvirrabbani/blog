import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

/**
 * The same libSQL adapter drives both environments: a local `file:` database in
 * development, and a hosted libSQL server (Turso) in production. Only the URL
 * and auth token differ, so the schema and migrations stay identical.
 */
const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL ?? 'file:./dev.db'
  const authToken = process.env.DATABASE_AUTH_TOKEN

  return new PrismaClient({
    adapter: new PrismaLibSql(authToken ? { url, authToken } : { url }),
  })
}

declare const globalThis: {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>
} & typeof global

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}
