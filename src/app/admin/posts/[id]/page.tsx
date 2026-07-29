import { notFound } from 'next/navigation'
import { getPost } from '@/lib/posts'
import { updatePost } from '@/lib/actions/posts'
import { PostForm } from '../post-form'

export const metadata = { title: 'Edit post' }

/** The route param is the post's slug — with no database there are no opaque ids. */
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  return (
    <>
      <h1 className="mb-8 text-xl font-semibold tracking-tight">Edit post</h1>
      <PostForm action={updatePost.bind(null, slug)} post={post} submitLabel="Save changes" />
    </>
  )
}
