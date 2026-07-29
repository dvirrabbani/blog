'use client'

import { useState } from 'react'
import { useImagePicker } from '@/components/image-upload-dialog'

export function CoverImageField({
  name,
  defaultValue,
}: {
  name: string
  defaultValue?: string | null
}) {
  const [url, setUrl] = useState(defaultValue ?? '')
  const { open, elements } = useImagePicker({ defaultAspect: 16 / 9, onUploaded: setUrl })

  return (
    <div>
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Cover preview"
            className="w-full rounded border border-border object-cover"
          />
          <div className="flex items-center gap-4">
            <button type="button" onClick={open} className="text-sm text-accent hover:underline">
              Replace
            </button>
            <button
              type="button"
              onClick={() => setUrl('')}
              className="text-sm text-muted hover:text-foreground"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={open}
          className="w-full rounded border border-dashed border-border px-4 py-6 text-sm text-muted hover:border-accent hover:text-foreground"
        >
          Add a cover image
        </button>
      )}

      {elements}
    </div>
  )
}
