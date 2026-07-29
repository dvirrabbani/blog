# Notes — a personal blog

Next.js (App Router) blog with a local authoring panel. Content lives in a JSON file
committed to the repo, so **the site deploys with no database and no environment
variables**.

## Setup

```bash
npm install
```

```bash
npm run dev
```

- Blog: http://localhost:3000
- Admin: http://localhost:3000/admin

The blog works immediately. To use the admin panel, copy `.env.example` to `.env` and set
`SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

## Deploying

Push to GitHub and import the repo into any Next.js host — Vercel, Netlify, Cloudflare,
or your own server. There is nothing to configure: no database to provision, no
connection string, no storage bucket.

Set `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the host's environment
variables only if you want `/admin` reachable on the deployed site. It is read-only there
either way — see below.

## Writing posts

Run the app locally, sign in at `/admin`, and write. Saving rewrites
`content/posts.json`; images added through the editor are written to `public/uploads/`.
Then commit both and push:

```bash
git add content public/uploads && git commit -m "New post" && git push
```

Your host rebuilds and the post is live.

**Why local-only:** serverless hosts serve the app from a read-only filesystem, so the
deployed site cannot write the JSON file. The app detects this by asking the filesystem
whether `content/posts.json` is writable, rather than guessing from `NODE_ENV` — so a
self-hosted deployment with a real disk stays fully editable. Where it isn't writable,
the admin panel shows a read-only notice, hides the create and delete controls, and
uploads return 503.

You can also just edit `content/posts.json` by hand. Each entry is:

```json
{
  "slug": "hello-world",
  "title": "Hello, world",
  "excerpt": "Shown on the home page and in link previews.",
  "coverImage": "/uploads/example-cover.jpg",
  "published": true,
  "publishedAt": "2026-07-08T00:00:00.000Z",
  "content": "Markdown body."
}
```

`coverImage` may be `null`, and `publishedAt` is `null` for drafts. Unpublished posts
never appear on the public site and their URLs 404.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run images:examples` | Regenerate the two example illustrations |

## How it works

- **Content** is `content/posts.json`, read through `src/lib/posts.ts`. Published post
  pages are prerendered at build time via `generateStaticParams`, so the public site is
  static HTML.
- **Auth** is a signed JWT in an httpOnly cookie (`src/lib/session.ts`). There is no user
  table: the single admin comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and the cookie
  stores only the email, rechecked on every request — so changing `ADMIN_EMAIL`
  invalidates existing sessions. The password comparison hashes both sides first so it
  can run in constant time without leaking length.
- **Post content** is markdown, written in the editor at
  `src/app/admin/posts/markdown-editor.tsx` — a toolbar plus a live preview that renders
  with the same component as the public post page, so what you see is what publishes.

  Supported: `**bold**`, `*italic*`, `` `code` ``, `[links](url)`, `![images](url)`,
  `##`/`###` headings, `-` and `1.` lists, `>` quotes, ``` fenced code blocks, and `---`
  rules. Parsed into React elements (never `dangerouslySetInnerHTML`) by
  `src/components/post-content.tsx`, which also restricts link and image URLs so a
  `javascript:` URL can't execute.

  Toolbar buttons toggle: pressing **B** on already-bold text unwraps it. `Ctrl/Cmd+B`,
  `+I`, and `+K` are bound to bold, italic, and link.
- **Images** are cropped in the browser before upload (`src/components/image-upload-dialog.tsx`),
  so only the cropped region is ever sent. Ratio presets are Free, 16:9, 4:3, 3:2 and
  1:1; output is capped at 2000px wide and re-encoded as JPEG. The **Cover image** field
  defaults to 16:9; the toolbar's **Image** button defaults to Free and inserts
  `![alt](url)` at the cursor.

  `POST /api/upload` requires a signed-in admin, caps size at 8MB, and identifies files
  by their magic bytes rather than trusting the client's `Content-Type` or filename — a
  script renamed to `.jpg` is rejected. Filenames are server-generated UUIDs, so nothing
  from the client reaches the filesystem path. Files land in `public/uploads/`, which is
  committed because posts reference them by path.
- **Site name and description** are in `src/lib/site.ts`.

## Known limitations

- Deleting a post does not delete its images; orphans stay in `public/uploads/`.
- Cropping is destructive — the original upload is never stored, so re-cropping means
  re-uploading.
- Publishing requires a commit and redeploy. That is the trade for having no database.
