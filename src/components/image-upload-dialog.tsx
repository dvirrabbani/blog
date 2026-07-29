'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

const RATIOS = [
  { label: 'Free', value: undefined },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '1:1', value: 1 },
] as const

// Keeps large photos from becoming multi-megabyte uploads.
const MAX_OUTPUT_WIDTH = 2000

function centeredCrop(width: number, height: number, aspect: number): Crop {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height)
}

async function cropToBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  // The crop is in rendered pixels; scale it up to the image's natural size.
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  const sourceWidth = crop.width * scaleX
  const sourceHeight = crop.height * scaleY
  const scale = Math.min(1, MAX_OUTPUT_WIDTH / sourceWidth)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sourceWidth * scale)
  canvas.height = Math.round(sourceHeight * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare the image.')

  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
      'image/jpeg',
      0.9,
    )
  })
}

/**
 * Wires a hidden file input to the crop dialog. Returns a trigger plus the
 * elements to render, so callers keep control of their own button styling.
 *
 * The object URL is created and revoked in event handlers rather than an
 * effect: an effect cleanup would revoke it during StrictMode's remount and
 * leave the dialog showing a broken image.
 */
export function useImagePicker({
  defaultAspect,
  onUploaded,
}: {
  defaultAspect?: number
  onUploaded: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [picked, setPicked] = useState<{ src: string }>()

  function close() {
    if (picked) URL.revokeObjectURL(picked.src)
    setPicked(undefined)
  }

  const elements = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0]
          // Reset so picking the same file again still fires a change.
          event.target.value = ''
          if (selected) setPicked({ src: URL.createObjectURL(selected) })
        }}
      />
      {picked && (
        <ImageUploadDialog
          src={picked.src}
          defaultAspect={defaultAspect}
          onUploaded={(url) => {
            close()
            onUploaded(url)
          }}
          onCancel={close}
        />
      )}
    </>
  )

  return { open: () => inputRef.current?.click(), elements }
}

export function ImageUploadDialog({
  src,
  defaultAspect,
  onUploaded,
  onCancel,
}: {
  src: string
  /** Cover images default to 16:9; inline images start free-form. */
  defaultAspect?: number
  onUploaded: (url: string) => void
  onCancel: () => void
}) {
  const [crop, setCrop] = useState<Crop>()
  const [aspect, setAspect] = useState<number | undefined>(defaultAspect)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  const onImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = event.currentTarget
      if (aspect) setCrop(centeredCrop(width, height, aspect))
    },
    [aspect],
  )

  function changeAspect(next: number | undefined) {
    setAspect(next)
    const image = imageRef.current
    if (!image) return

    if (next) setCrop(centeredCrop(image.width, image.height, next))
    else setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90 })
  }

  async function upload() {
    const image = imageRef.current
    if (!image) return

    setBusy(true)
    setError(undefined)

    try {
      // Use the box currently on screen — `onComplete` only fires after a drag,
      // so relying on it would ignore a ratio the user picked but never dragged.
      const region: PixelCrop =
        crop && crop.width > 0 && crop.height > 0
          ? convertToPixelCrop(crop, image.width, image.height)
          : { unit: 'px', x: 0, y: 0, width: image.width, height: image.height }

      const blob = await cropToBlob(image, region)

      const body = new FormData()
      body.append('file', blob, 'image.jpg')

      const response = await fetch('/api/upload', { method: 'POST', body })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error ?? 'Upload failed.')

      onUploaded(result.url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.')
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-background">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <span className="mr-1 text-sm text-muted">Ratio</span>
          {RATIOS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => changeAspect(option.value)}
              aria-pressed={aspect === option.value}
              className={`rounded px-2.5 py-1 text-sm ${
                aspect === option.value
                  ? 'bg-foreground text-background'
                  : 'text-muted hover:bg-[color-mix(in_srgb,var(--muted)_18%,transparent)] hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[color-mix(in_srgb,var(--muted)_10%,transparent)] p-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            aspect={aspect}
            keepSelection
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={src}
              alt="Image to crop"
              onLoad={onImageLoad}
              className="max-h-[60vh] w-auto"
            />
          </ReactCrop>
        </div>

        <div className="flex items-center gap-3 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={upload}
            disabled={busy}
            className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
          >
            {busy ? 'Uploading…' : 'Crop & upload'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-sm text-muted hover:text-foreground"
          >
            Cancel
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}
