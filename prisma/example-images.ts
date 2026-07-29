import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

/**
 * The example post needs real image files, but `public/uploads/` is gitignored,
 * so the seed regenerates them instead of committing binaries. Filenames are
 * fixed (rather than the UUIDs a real upload gets) so re-seeding overwrites
 * them rather than piling up copies.
 */
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export const EXAMPLE_COVER = '/uploads/example-cover.jpg'
export const EXAMPLE_INLINE = '/uploads/example-desk.jpg'

// Warm, muted tones picked to sit alongside the site's --accent (#8a5a2b).
function coverSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f2e7d6"/>
      <stop offset="60%" stop-color="#e3c9a3"/>
      <stop offset="100%" stop-color="#c79a63"/>
    </linearGradient>
    <linearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a97c4c"/>
      <stop offset="100%" stop-color="#8a5a2b"/>
    </linearGradient>
    <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5c4326"/>
      <stop offset="100%" stop-color="#3b2b19"/>
    </linearGradient>
  </defs>

  <rect width="1600" height="900" fill="url(#sky)"/>
  <circle cx="1180" cy="270" r="96" fill="#fdf6e9" opacity="0.92"/>

  <path d="M0 600 C 260 500, 420 620, 700 566 C 980 512, 1180 600, 1600 520 L1600 900 L0 900 Z"
        fill="url(#hillBack)" opacity="0.55"/>
  <path d="M0 706 C 300 636, 560 742, 860 690 C 1160 638, 1360 720, 1600 664 L1600 900 L0 900 Z"
        fill="url(#hillFront)" opacity="0.9"/>
</svg>`
}

function inlineSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#faf4e8"/>
      <stop offset="100%" stop-color="#ecdcc4"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="900" fill="url(#paper)"/>

  <!-- an open notebook, nodding to the other posts -->
  <rect x="180" y="210" width="840" height="500" rx="10" fill="#fffdf7" stroke="#d9cdb6" stroke-width="3"/>
  <line x1="600" y1="210" x2="600" y2="710" stroke="#d9cdb6" stroke-width="3"/>

  ${[0, 1, 2, 3, 4]
    .map((i) => {
      const y = 300 + i * 66
      const rightWidth = i === 4 ? 150 : 300
      return `<line x1="250" y1="${y}" x2="530" y2="${y}" stroke="#c9bda6" stroke-width="6" stroke-linecap="round"/>
      <line x1="670" y1="${y}" x2="${670 + rightWidth}" y2="${y}" stroke="#c9bda6" stroke-width="6" stroke-linecap="round"/>`
    })
    .join('\n  ')}

  <rect x="742" y="742" width="330" height="16" rx="8" fill="#8a5a2b" opacity="0.85"/>
  <circle cx="734" cy="750" r="12" fill="#5c4326"/>
</svg>`
}

async function render(svg: string, filename: string) {
  const buffer = await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toBuffer()
  await writeFile(path.join(UPLOAD_DIR, filename), buffer)
}

export async function writeExampleImages() {
  await mkdir(UPLOAD_DIR, { recursive: true })
  await render(coverSvg(), 'example-cover.jpg')
  await render(inlineSvg(), 'example-desk.jpg')
}
