import 'server-only'
import { access, readFile, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'

/**
 * Posts live in a JSON file committed to the repo instead of a database, so the site
 * deploys with no external services and no environment variables.
 *
 * The trade is that content is only writable where the filesystem is writable — locally.
 * On a serverless host the bundle is read-only, so the admin panel becomes read-only too
 * and publishing means committing the JSON and redeploying. See `canEditContent()`.
 */
export type Post = {
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string | null
  published: boolean
  publishedAt: string | null
}

const STORE = path.join(process.cwd(), 'content', 'posts.json')

/** Reads fresh each call; Next's own caching decides how often pages re-render. */
async function readStore(): Promise<Post[]> {
  const raw = await readFile(STORE, 'utf8')
  const parsed: unknown = JSON.parse(raw)

  if (!Array.isArray(parsed)) {
    throw new Error(`${STORE} must contain a JSON array of posts.`)
  }

  return parsed as Post[]
}

async function writeStore(posts: Post[]) {
  await writeFile(STORE, `${JSON.stringify(posts, null, 2)}\n`, 'utf8')
}

let writable: Promise<boolean> | undefined

/**
 * Asks the filesystem whether the store is writable rather than inferring it from
 * NODE_ENV. Serverless hosts bundle the app read-only, while a self-hosted production
 * server has a real disk and can legitimately accept edits — NODE_ENV cannot tell those
 * apart, so it would both block the second case and mis-detect the first.
 *
 * Cached per process: the answer cannot change while the app is running.
 */
export function canEditContent() {
  writable ??= access(STORE, constants.W_OK).then(
    () => true,
    () => false,
  )
  return writable
}

function byNewest(a: Post, b: Post) {
  return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
}

export async function getPublishedPosts() {
  const posts = await readStore()
  return posts.filter((post) => post.published).sort(byNewest)
}

export async function getPost(slug: string) {
  const posts = await readStore()
  return posts.find((post) => post.slug === slug) ?? null
}

export async function getPublishedPost(slug: string) {
  const post = await getPost(slug)
  return post?.published ? post : null
}

/** Admin listing — drafts included, drafts first so unfinished work is visible. */
export async function getAllPosts() {
  const posts = await readStore()
  return posts.sort((a, b) => Number(a.published) - Number(b.published) || byNewest(a, b))
}

export async function getSlugs() {
  const posts = await readStore()
  return posts.map((post) => post.slug)
}

async function assertWritable() {
  if (!(await canEditContent())) {
    throw new Error(
      'Content is read-only in this environment. Edit content/posts.json locally, ' +
        'commit it, and redeploy.',
    )
  }
}

export async function savePost(post: Post, replacingSlug?: string) {
  await assertWritable()

  const posts = await readStore()
  const index = posts.findIndex((existing) => existing.slug === (replacingSlug ?? post.slug))

  if (index === -1) posts.unshift(post)
  else posts[index] = post

  await writeStore(posts)
}

export async function deletePostBySlug(slug: string) {
  await assertWritable()

  const posts = await readStore()
  await writeStore(posts.filter((post) => post.slug !== slug))
}

/** Appends a numeric suffix rather than rejecting a title that collides. */
export async function uniqueSlug(desired: string, keepingSlug?: string) {
  const taken = new Set((await getSlugs()).filter((slug) => slug !== keepingSlug))

  if (!taken.has(desired)) return desired

  let n = 2
  while (taken.has(`${desired}-${n}`)) n++
  return `${desired}-${n}`
}
