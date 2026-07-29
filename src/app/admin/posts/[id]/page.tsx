import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { updatePost } from '@/lib/actions/posts'
import { PostForm } from '../post-form'

export const metadata = { title: 'Edit post' }

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })

  if (!post) notFound()

  return (
    <>
      <h1 className="mb-8 text-xl font-semibold tracking-tight">Edit post</h1>
      <PostForm action={updatePost.bind(null, id)} post={post} submitLabel="Save changes" />
    </>
  )
}
