import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { siteConfig } from '@/lib/site'
import { formatDate } from '@/lib/format'

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
    },
  })

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <p className="mb-12 text-muted">{siteConfig.description}</p>

      {posts.length === 0 ? (
        <p className="text-muted">
          Nothing published yet.{' '}
          <Link href="/admin" className="text-accent hover:underline">
            Write the first post
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-9">
          {posts.map((post) => (
            <li key={post.id}>
              <p className="mb-1 text-sm text-muted">{formatDate(post.publishedAt)}</p>
              <h2 className="text-xl font-semibold tracking-tight">
                <Link href={`/posts/${post.slug}`} className="hover:text-accent">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-1.5 text-muted">{post.excerpt}</p>
              {post.coverImage && (
                <Link href={`/posts/${post.slug}`} className="mt-3 block">
                  <Image
                    src={post.coverImage}
                    alt=""
                    width={1200}
                    height={675}
                    className="w-full rounded-md border border-border object-cover"
                  />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
