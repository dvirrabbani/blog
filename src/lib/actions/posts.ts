'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/dal'
import { isAllowedImageUrl } from '@/lib/image-url'
import {
  canEditContent,
  deletePostBySlug,
  getPost,
  savePost,
  uniqueSlug,
  type Post,
} from '@/lib/posts'

export type PostFormState = { error?: string } | undefined

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

function readForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  // Browsers normalize textarea line breaks to CRLF on submit
  const content = String(formData.get('content') ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
  const excerpt = String(formData.get('excerpt') ?? '').trim()
  const published = formData.get('published') === 'on'
  const slug = slugify(String(formData.get('slug') ?? '') || title)

  const cover = String(formData.get('coverImage') ?? '').trim()
  const coverImage = isAllowedImageUrl(cover) ? cover : null

  return { title, content, excerpt, published, slug, coverImage }
}

const READ_ONLY =
  'Content is read-only here. Edit content/posts.json locally, commit it, and redeploy.'

function revalidateAll(slug: string) {
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath(`/posts/${slug}`)
}

export async function createPost(
  _state: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireUser()
  if (!(await canEditContent())) return { error: READ_ONLY }

  const { title, content, excerpt, published, slug, coverImage } = readForm(formData)

  if (!title || !content) {
    return { error: 'Title and content are required.' }
  }

  const post: Post = {
    slug: await uniqueSlug(slug || 'post'),
    title,
    excerpt: excerpt || content.slice(0, 160),
    content,
    coverImage,
    published,
    publishedAt: published ? new Date().toISOString() : null,
  }

  await savePost(post)

  revalidateAll(post.slug)
  redirect('/admin')
}

export async function updatePost(
  currentSlug: string,
  _state: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireUser()
  if (!(await canEditContent())) return { error: READ_ONLY }

  const { title, content, excerpt, published, slug, coverImage } = readForm(formData)

  if (!title || !content) {
    return { error: 'Title and content are required.' }
  }

  const existing = await getPost(currentSlug)
  if (!existing) return { error: 'Post not found.' }

  const post: Post = {
    slug: await uniqueSlug(slug || 'post', currentSlug),
    title,
    excerpt: excerpt || content.slice(0, 160),
    content,
    coverImage,
    published,
    // Keep the original date so editing a published post does not move it to the top.
    publishedAt: published ? (existing.publishedAt ?? new Date().toISOString()) : null,
  }

  await savePost(post, currentSlug)

  revalidateAll(existing.slug)
  if (post.slug !== existing.slug) revalidatePath(`/posts/${post.slug}`)
  redirect('/admin')
}

export async function deletePost(formData: FormData) {
  await requireUser()
  if (!(await canEditContent())) return

  const slug = String(formData.get('slug') ?? '')
  await deletePostBySlug(slug)

  revalidateAll(slug)
}
