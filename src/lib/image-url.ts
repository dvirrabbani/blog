const LOCAL_UPLOAD_PATH = /^\/uploads\/[\w.-]+$/

/**
 * Accepts only image paths this app produced. Images live in `public/uploads/` and are
 * committed with the posts that use them, so a valid value is always a local path —
 * anything absolute would be pointing at a third-party host.
 *
 * Kept free of server-only imports so it stays pure and directly testable.
 */
export function isAllowedImageUrl(value: string) {
  return LOCAL_UPLOAD_PATH.test(value)
}
