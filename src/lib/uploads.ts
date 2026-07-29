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
 * Serverless hosts have a read-only filesystem, so uploads go to blob storage
 * there and to `public/uploads/` locally. The choice is made by the presence of
 * the blob token rather than NODE_ENV, so a production build still works on a
 * normal server with a writable disk.
 */
export function usingBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export async function saveUpload(bytes: Uint8Array, ext: string, mime: string) {
  const filename = `${randomUUID()}.${ext}`

  if (usingBlobStorage()) {
    // Imported lazily so local installs never load the SDK.
    const { put } = await import('@vercel/blob')
    const { url } = await put(`uploads/${filename}`, Buffer.from(bytes), {
      access: 'public',
      contentType: mime,
      // Our filename is already a UUID; a second random suffix would only make
      // the URL longer and break the delete-by-URL path.
      addRandomSuffix: false,
    })
    return url
  }

  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, filename), bytes)

  return `/uploads/${filename}`
}
