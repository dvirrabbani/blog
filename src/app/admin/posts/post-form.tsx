'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import type { PostFormState } from '@/lib/actions/posts'
import { MarkdownEditor } from './markdown-editor'
import { CoverImageField } from './cover-image-field'

type Post = {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string | null
  published: boolean
}

const inputClass =
  'w-full rounded border border-border bg-transparent px-3 py-2 outline-none focus:border-accent'

export function PostForm({
  action,
  post,
  submitLabel,
}: {
  action: (state: PostFormState, formData: FormData) => Promise<PostFormState>
  post?: Post
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm text-muted">
          Title
        </label>
        <input id="title" name="title" defaultValue={post?.title} required className={inputClass} />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1.5 block text-sm text-muted">
          Slug <span className="text-xs">(optional — generated from the title)</span>
        </label>
        <input id="slug" name="slug" defaultValue={post?.slug} className={inputClass} />
      </div>

      <div>
        <label htmlFor="excerpt" className="mb-1.5 block text-sm text-muted">
          Excerpt <span className="text-xs">(optional)</span>
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={post?.excerpt}
          className={inputClass}
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm text-muted">
          Cover image <span className="text-xs">(optional — shown on the home page)</span>
        </span>
        <CoverImageField name="coverImage" defaultValue={post?.coverImage} />
      </div>

      <div>
        <label htmlFor="content" className="mb-1.5 block text-sm text-muted">
          Content <span className="text-xs">(markdown — use the toolbar or type it directly)</span>
        </label>
        <MarkdownEditor name="content" defaultValue={post?.content} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={post?.published} />
        Published
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
        <Link href="/admin" className="text-sm text-muted hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  )
}
