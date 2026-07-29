import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { writeExampleImages } from './example-images'
import { samplePosts } from './seed-posts'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const authToken = process.env.DATABASE_AUTH_TOKEN

const DEFAULT_PASSWORD = 'changeme123'

/** A hosted database is reachable from the internet; a local file is not. */
const isRemote = !url.startsWith('file:')

const prisma = new PrismaClient({
  adapter: new PrismaLibSql(authToken ? { url, authToken } : { url }),
})

/**
 * `--admin-only` creates just the account and skips the sample content. Use it
 * when seeding a deployed database, where the example posts would reference
 * images that only exist on a local disk.
 */
const adminOnly = process.argv.includes('--admin-only')

/** Host only, never the token — enough to catch "wrong database" mistakes. */
function describeTarget() {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'file:' ? url : `${parsed.protocol}//${parsed.hostname}`
  } catch {
    return url
  }
}

async function main() {
  console.log(`Target: ${describeTarget()}`)

  const email = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase()
  const password = process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD
  const name = process.env.ADMIN_NAME ?? 'Admin'

  // The development default is public knowledge — it's in the README. Seeding it
  // into a database the internet can reach would leave the admin panel wide open.
  if (isRemote && password === DEFAULT_PASSWORD) {
    throw new Error(
      `Refusing to seed the default password into a remote database (${describeTarget()}).\n` +
        'Set ADMIN_PASSWORD to something private, then run this again.',
    )
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  })

  if (adminOnly) {
    console.log(`Seeded admin <${email}>. Skipped sample posts (--admin-only).`)
    return
  }

  await writeExampleImages()

  for (const post of samplePosts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: { ...post, authorId: user.id },
    })
  }

  console.log(`Seeded admin <${email}> and ${samplePosts.length} posts.`)
}

main()
  .catch((error) => {
    // A refusal is an expected outcome, not a crash — no stack trace needed.
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
