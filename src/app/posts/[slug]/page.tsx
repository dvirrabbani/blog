import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPublishedPost, getPublishedPosts } from '@/lib/posts'
import { siteConfig } from '@/lib/site'
import { formatDate } from '@/lib/format'
import { PostContent } from '@/components/post-content'

type Props = { params: Promise<{ slug: string }> }

/** Content is known at build time, so every post page can be prerendered. */
export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPost(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPublishedPost(slug)

  if (!post) notFound()

  return (
    <article className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← All writing
      </Link>

      <header className="mt-8 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {formatDate(post.publishedAt)} · {siteConfig.author}
        </p>
      </header>

      {post.coverImage && (
        <Image
          src={post.coverImage}
          alt=""
          width={1200}
          height={675}
          priority
          className="mb-10 w-full rounded-md border border-border object-cover"
        />
      )}

      <PostContent content={post.content} />
    </article>
  )
}
