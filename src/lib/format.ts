/** Accepts the ISO strings stored in content/posts.json, or a Date. */
export function formatDate(date: Date | string | null) {
  if (!date) return 'Draft'

  const value = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(value.getTime())) return 'Draft'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(value)
}
