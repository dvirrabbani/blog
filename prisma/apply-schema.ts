import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'

/**
 * Applies `deploy/schema.sql` to whatever DATABASE_URL points at — a local file or a
 * hosted libSQL database. Exists so setting up a deployed database doesn't require
 * pasting SQL into a web console, which is easy to skip and fails confusingly later
 * ("no such table: main.User" when seeding).
 */
const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const authToken = process.env.DATABASE_AUTH_TOKEN

/** Never print the token, and keep the host visible enough to confirm the target. */
function describe(target: string) {
  try {
    const parsed = new URL(target)
    return parsed.protocol === 'file:' ? target : `${parsed.protocol}//${parsed.hostname}`
  } catch {
    return target
  }
}

async function main() {
  const sql = readFileSync(
    fileURLToPath(new URL('../deploy/schema.sql', import.meta.url)),
    'utf8',
  )

  const client = createClient(authToken ? { url, authToken } : { url })
  console.log(`Target: ${describe(url)}`)

  const existing = await client.execute(
    "select name from sqlite_master where type='table' and name not like 'sqlite_%' and name not like '_prisma%'",
  )
  const tables = existing.rows.map((row) => String(row.name))

  if (tables.length > 0) {
    console.log(`Already has tables: ${tables.join(', ')} — nothing to do.`)
    console.log('Drop them first if you meant to recreate the schema.')
    client.close()
    return
  }

  await client.executeMultiple(sql)

  const after = await client.execute(
    "select name from sqlite_master where type='table' and name not like 'sqlite_%' and name not like '_prisma%'",
  )
  console.log(`Created: ${after.rows.map((row) => String(row.name)).join(', ')}`)
  client.close()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
