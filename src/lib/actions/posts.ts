'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/dal'
import { isAllowedImageUrl } from '@/lib/image-url'

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
  const content = String(formData.get('content') ?? '').replace(/\r\n/g, '\n').trim()
  const excerpt = String(formData.get('excerpt') ?? '').trim()
  const published = formData.get('published') === 'on'
  const slug = slugify(String(formData.get('slug') ?? '') || title)

  const cover = String(formData.get('coverImage') ?? '').trim()
  const coverImage = isAllowedImageUrl(cover) ? cover : null

  return { title, content, excerpt, published, slug, coverImage }
}

async function uniqueSlug(slug: string, excludeId?: string) {
  let candidate = slug
  let n = 2
  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeId) return candidate
    candidate = `${slug}-${n++}`
  }
}

export async function createPost(
  _state: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireUser()
  const { title, content, excerpt, published, slug, coverImage } = readForm(formData)

  if (!title || !content) {
    return { error: 'Title and content are required.' }
  }

  await prisma.post.create({
    data: {
      title,
      content,
      excerpt: excerpt || content.slice(0, 160),
      coverImage,
      slug: await uniqueSlug(slug || 'post'),
      published,
      publishedAt: published ? new Date() : null,
      authorId: user.id,
    },
  })

  revalidatePath('/')
  revalidatePath('/admin')
  redirect('/admin')
}

export async function updatePost(
  id: string,
  _state: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireUser()
  const { title, content, excerpt, published, slug, coverImage } = readForm(formData)

  if (!title || !content) {
    return { error: 'Title and content are required.' }
  }

  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) return { error: 'Post not found.' }

  await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      excerpt: excerpt || content.slice(0, 160),
      coverImage,
      slug: await uniqueSlug(slug || 'post', id),
      published,
      publishedAt: published ? (existing.publishedAt ?? new Date()) : null,
    },
  })

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath(`/posts/${existing.slug}`)
  redirect('/admin')
}

export async function deletePost(formData: FormData) {
  await requireUser()
  const id = String(formData.get('id') ?? '')

  await prisma.post.delete({ where: { id } })

  revalidatePath('/')
  revalidatePath('/admin')
}
