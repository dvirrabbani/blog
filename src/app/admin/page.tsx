import Link from 'next/link'
import { getAllPosts, canEditContent } from '@/lib/posts'
import { deletePost } from '@/lib/actions/posts'
import { formatDate } from '@/lib/format'

export const metadata = { title: 'Admin' }

export default async function AdminPage() {
  const posts = await getAllPosts()
  const editable = await canEditContent()

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Posts</h1>
        {editable && (
          <Link
            href="/admin/posts/new"
            className="rounded bg-foreground px-3 py-1.5 text-sm text-background"
          >
            New post
          </Link>
        )}
      </div>

      {!editable && (
        <p className="mb-8 rounded border border-border bg-[color-mix(in_srgb,var(--muted)_8%,transparent)] px-4 py-3 text-sm text-muted">
          Read-only here — this deployment has no writable filesystem. Edit{' '}
          <code>content/posts.json</code> locally, commit it, and redeploy.
        </p>
      )}

      {posts.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {posts.map((post) => (
            <li key={post.slug} className="flex items-baseline justify-between gap-4 py-4">
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
                  href={`/admin/posts/${post.slug}`}
                  className="text-muted hover:text-foreground"
                >
                  {editable ? 'Edit' : 'Source'}
                </Link>
                {editable && (
                  <form action={deletePost}>
                    <input type="hidden" name="slug" value={post.slug} />
                    <button type="submit" className="text-muted hover:text-red-600">
                      Delete
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
