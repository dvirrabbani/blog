import 'server-only'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

// Extensions are chosen by us from the sniffed type — never taken from the
// uploaded filename, which keeps `../` and double extensions out of the path.
const SIGNATURES: { ext: string; mime: string; matches: (bytes: Uint8Array) => boolean }[] = [
  {
    ext: 'jpg',
    mime: 'image/jpeg',
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: 'png',
    mime: 'image/png',
    matches: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    ext: 'gif',
    mime: 'image/gif',
    matches: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  },
  {
    ext: 'webp',
    mime: 'image/webp',
    matches: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
]

export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

/** Identifies the image by its magic bytes, so a renamed .exe can't get through. */
export function sniffImageType(bytes: Uint8Array) {
  return SIGNATURES.find((signature) => signature.matches(bytes)) ?? null
}

/**
 * Images are committed to `public/uploads/` alongside the posts that reference them, so
 * the site needs no object storage. That only works where the filesystem is writable —
 * uploading is therefore a local-authoring step, same as editing the JSON store.
 */
export async function saveUpload(bytes: Uint8Array, ext: string) {
  const filename = `${randomUUID()}.${ext}`

  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, filename), bytes)

  return `/uploads/${filename}`
}
