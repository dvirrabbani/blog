import { createPost } from '@/lib/actions/posts'
import { PostForm } from '../post-form'

export const metadata = { title: 'New post' }

export default function NewPostPage() {
  return (
    <>
      <h1 className="mb-8 text-xl font-semibold tracking-tight">New post</h1>
      <PostForm action={createPost} submitLabel="Create post" />
    </>
  )
}
