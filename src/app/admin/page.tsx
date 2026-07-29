import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { deletePost } from '@/lib/actions/posts'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Admin' }

export default async function AdminPage() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      published: true,
      publishedAt: true,
      updatedAt: true,
    },
  })

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded bg-foreground px-3 py-1.5 text-sm text-background"
        >
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {posts.map((post) => (
            <li key={post.id} className="flex items-baseline justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{post.title}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {post.published ? formatDate(post.publishedAt) : 'Draft'} · /{post.slug}
                </p>
              </div>

              <div className="flex shrink-0 items-baseline gap-4 text-sm">
                {post.published && (
                  <Link href={`/posts/${post.slug}`} className="text-muted hover:text-foreground">
                    View
                  </Link>
                )}
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="text-muted hover:text-foreground"
                >
                  Edit
                </Link>
                <form action={deletePost}>
                  <input type="hidden" name="id" value={post.id} />
                  <button type="submit" className="text-muted hover:text-red-600">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
