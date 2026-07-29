import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/dal'
import { canEditContent } from '@/lib/posts'
import { MAX_UPLOAD_BYTES, saveUpload, sniffImageType } from '@/lib/uploads'

export async function POST(request: Request) {
  // Uploads write to disk, so this must be an authenticated admin.
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  // A read-only deployment cannot store the file, so say so instead of failing on write.
  if (!(await canEditContent())) {
    return NextResponse.json(
      { error: 'Uploads are disabled here. Add images locally and commit them.' },
      { status: 503 },
    )
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty.' }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Image must be under ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` },
      { status: 413 },
    )
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const type = sniffImageType(bytes)

  if (!type) {
    return NextResponse.json(
      { error: 'Unsupported file. Use JPEG, PNG, GIF or WebP.' },
      { status: 415 },
    )
  }

  const url = await saveUpload(bytes, type.ext)

  return NextResponse.json({ url })
}
