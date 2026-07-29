import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { EXAMPLE_COVER } from './example-images'

/** Post bodies live in `prisma/content/<slug>.md` — easier to edit than escaped template literals. */
function body(slug: string) {
  return readFileSync(fileURLToPath(new URL(`./content/${slug}.md`, import.meta.url)), 'utf8').trim()
}

type SamplePost = {
  slug: string
  title: string
  excerpt: string
  coverImage?: string
  published: boolean
  /** Backdated so the seeded posts land in a deliberate order instead of all sharing one timestamp. */
  daysAgo: number
}

const posts: SamplePost[] = [
  {
    slug: 'hello-world',
    title: 'Hello, world',
    excerpt: 'The obligatory first post — why I started writing here and what to expect.',
    published: true,
    daysAgo: 21,
  },
  {
    slug: 'on-keeping-a-notebook',
    title: 'On keeping a notebook',
    excerpt: 'A small habit that has quietly changed how I think about almost everything.',
    published: true,
    daysAgo: 16,
  },
  {
    slug: 'writing-with-pictures',
    title: 'Writing with pictures',
    excerpt:
      'An example post showing how cover images and inline images sit inside a piece of writing.',
    coverImage: EXAMPLE_COVER,
    published: true,
    daysAgo: 11,
  },
  {
    slug: 'building-this-blog',
    title: 'Building this blog',
    excerpt: 'A tour of what runs this site — the stack, the decisions, and the parts I would defend.',
    published: true,
    daysAgo: 6,
  },
  {
    slug: 'running-this-blog',
    title: 'Running this blog locally',
    excerpt:
      'From a fresh clone to a running site in four commands, and how to write your first post.',
    published: true,
    daysAgo: 3,
  },
  {
    slug: 'what-comes-next',
    title: 'What comes next',
    excerpt: 'The honest backlog — what is missing, what is fragile, and what I would build first.',
    published: true,
    daysAgo: 0,
  },
  {
    slug: 'draft-thoughts-on-slowness',
    title: 'Thoughts on slowness',
    excerpt: 'Still working through this one — an argument for doing fewer things badly.',
    published: false,
    daysAgo: 1,
  },
]

const DAY_MS = 24 * 60 * 60 * 1000

export const samplePosts = posts.map(({ daysAgo, ...post }) => ({
  ...post,
  content: body(post.slug),
  publishedAt: post.published ? new Date(Date.now() - daysAgo * DAY_MS) : null,
}))
