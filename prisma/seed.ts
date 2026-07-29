import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { writeExampleImages } from './example-images'
import { samplePosts } from './seed-posts'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const authToken = process.env.DATABASE_AUTH_TOKEN

const prisma = new PrismaClient({
  adapter: new PrismaLibSql(authToken ? { url, authToken } : { url }),
})

/**
 * `--admin-only` creates just the account and skips the sample content. Use it
 * when seeding a deployed database, where the example posts would reference
 * images that only exist on a local disk.
 */
const adminOnly = process.argv.includes('--admin-only')

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase()
  const password = process.env.ADMIN_PASSWORD ?? 'changeme123'
  const name = process.env.ADMIN_NAME ?? 'Admin'

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
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
