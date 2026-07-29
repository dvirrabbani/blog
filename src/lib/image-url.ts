const LOCAL_UPLOAD_PATH = /^\/uploads\/[\w.-]+$/

export const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'

/**
 * Accepts only image URLs this app produced — a local upload path, or a blob URL
 * on our own storage host. Stops a crafted form from pointing a post's cover at
 * an arbitrary third-party URL.
 *
 * Kept free of server-only imports so it stays pure and directly testable.
 */
export function isAllowedImageUrl(value: string) {
  if (LOCAL_UPLOAD_PATH.test(value)) return true

  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.hostname.endsWith(BLOB_HOST_SUFFIX) &&
      LOCAL_UPLOAD_PATH.test(url.pathname)
    )
  } catch {
    return false
  }
}
