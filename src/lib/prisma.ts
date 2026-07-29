import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

/**
 * The same libSQL adapter drives both environments: a local `file:` database in
 * development, and a hosted libSQL server (Turso) in production. Only the URL
 * and auth token differ, so the schema and migrations stay identical.
 */
const prismaClientSingleton = () => {
  // Falling back to a local file in production is worse than failing: libSQL creates
  // the file if it is missing, so a forgotten DATABASE_URL surfaces much later as
  // "no such table: main.Post" instead of naming the variable that is actually absent.
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL is not set.\n' +
        "Add it in your host's environment variable settings — not in a .env file, which\n" +
        'is gitignored and never uploaded. On Vercel, tick every environment it should\n' +
        'apply to; a variable scoped to Production only is absent from Preview builds.\n' +
        'A hosted libSQL database also needs DATABASE_AUTH_TOKEN.',
    )
  }

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
