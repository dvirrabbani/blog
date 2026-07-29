import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/format'
import { PostContent } from '@/components/post-content'

type Props = { params: Promise<{ slug: string }> }

async function getPost(slug: string) {
  return prisma.post.findFirst({
    where: { slug, published: true },
    include: { author: { select: { name: true } } },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
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
  const post = await getPost(slug)

  if (!post) notFound()

  return (
    <article className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← All writing
      </Link>

      <header className="mt-8 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {formatDate(post.publishedAt)} · {post.author.name}
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
