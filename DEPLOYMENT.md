# Deploying to Vercel

The app runs unchanged on Vercel with two managed services in place of the local disk:

| Local | Deployed | Why |
| --- | --- | --- |
| `prisma/dev.db` (SQLite file) | Turso (hosted libSQL) | Vercel has no persistent disk |
| `public/uploads/` | Vercel Blob | Vercel's filesystem is read-only at runtime |

Nothing about the schema, migrations, or query code changes — Turso speaks the same
libSQL protocol as the local file, through the same `@prisma/adapter-libsql` driver.
The upload code picks its backend at runtime: blob storage when `BLOB_READ_WRITE_TOKEN`
is set, local disk otherwise.

> **Order matters.** Importing a project into Vercel starts a deploy immediately, and
> the first build will fail unless the database and environment variables already exist.
> The build needs both:
>
> - `SESSION_SECRET`, or the production guard throws and the build stops with
>   *"Failed to collect page data for /api/upload"*.
> - A reachable database **with the schema applied**, because the home page is
>   prerendered and queries `Post` at build time. A missing table fails the build with
>   *"no such table: main.Post"*. An empty table is fine — it renders "Nothing published
>   yet."
>
> So do steps 2–4 before step 5, and enter the variables on the import screen rather
> than after the first deploy.

---

## 1. Push the code to GitHub

The repo has one commit from `create-next-app` plus a commit with the app itself. Create
an empty repo on GitHub, then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
```

```bash
git push -u origin master
```

`.env` is gitignored, so no secrets are pushed. Verify with `git status --porcelain`
before pushing if you want to be certain.

## 2. Create the database

Either route works — the browser one installs nothing.

### Browser only (no CLI)

1. Sign up at [turso.tech](https://turso.tech) and create a database (free tier is plenty).
2. On the database page, copy the **URL** (`libsql://…`) and create a **token**. These
   become `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.
3. Apply the schema. With the URL and token in your environment:

   ```bash
   npm run db:push
   ```

   That runs [`deploy/schema.sql`](deploy/schema.sql) against whatever `DATABASE_URL`
   points at, prints the host it targeted, and refuses to touch a database that already
   has tables. You can also paste the file into the dashboard's SQL shell by hand.

**Skipping this step is the most common mistake.** Without it, the next command fails
with `no such table: main.User`, and the first Vercel build fails with
`no such table: main.Post`.

### With the CLI

```bash
turso auth login
```

```bash
turso db create notes-blog
```

```bash
turso db show notes-blog --url && turso db tokens create notes-blog
```

```bash
turso db shell notes-blog < deploy/schema.sql
```

`deploy/schema.sql` is checked in and current, so nothing needs regenerating to deploy.
Only after editing `prisma/schema.prisma`, refresh it with:

```bash
npm run db:sql
```

That writes `deploy/schema.sql` in place. It uses Prisma's `--output` flag rather than
shell redirection, because redirecting `npm run` also captures npm's own header lines and
would leave invalid SQL at the top of the file.

## 3. Create the blob store

In the Vercel dashboard: **Storage → Create → Blob**. Once created, copy the
`BLOB_READ_WRITE_TOKEN` it gives you. Connecting the store to the project also adds
this variable automatically.

## 4. Generate a session secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Do not reuse the local development value. The app refuses to start in production
without this, rather than signing sessions with an empty key.

## 5. Import the project into Vercel

**Add New → Project**, pick the GitHub repo. Vercel detects Next.js; the defaults are
correct. Before the first deploy, add these environment variables:

- `DATABASE_URL` — the `libsql://…` URL from step 2
- `DATABASE_AUTH_TOKEN` — the token from step 2
- `SESSION_SECRET` — the value from step 4
- `BLOB_READ_WRITE_TOKEN` — from step 3, if it wasn't added automatically
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` — only needed for step 6

Then deploy.

## 6. Create the admin account

The deployed database is empty, so there's no account to sign in with. Run the
admin-only seed from your machine, pointed at the production database:

```bash
DATABASE_URL='libsql://…' DATABASE_AUTH_TOKEN='…' ADMIN_EMAIL='you@example.com' ADMIN_PASSWORD='a-strong-password' ADMIN_NAME='Your Name' npm run db:seed:admin
```

On PowerShell, set the variables first with `$env:DATABASE_URL='…'` and then run
`npm run db:seed:admin`.

`--admin-only` deliberately skips the sample posts, which reference example images that
only exist on a local disk. Sign in at `https://<your-app>.vercel.app/admin` and write
your first post there.

The seed refuses to write the development default password (`changeme123`) into a remote
database, since that value is published in this repo. Set `ADMIN_PASSWORD` to something
private or the command stops without touching anything.

> **Keep `.env` pointed at your local database.** If you put the hosted URL in `.env`,
> every local `npm run dev` reads and writes production, and `npm run db:seed` would
> overwrite live content with sample posts. Pass production values inline for one-off
> commands instead, as above.

---

## Verifying the deploy

1. The home page lists nothing — expected, the database is empty until you write a post.
2. `/admin` redirects to `/login` when signed out.
3. Sign in with the credentials from step 6.
4. Create a post with a cover image. The image URL should be
   `https://<id>.public.blob.vercel-storage.com/uploads/…`, not `/uploads/…`.
5. Publish it and confirm it appears on the home page with the cover rendering.

If step 4 produces a `/uploads/…` URL, `BLOB_READ_WRITE_TOKEN` isn't reaching the
runtime — the app fell back to disk, and the file will vanish on the next deploy.

## Troubleshooting

**Build fails on `@/generated/prisma/client`** — the generated client is gitignored on
purpose and rebuilt by the `postinstall` script. If it's missing, confirm `postinstall`
survived in `package.json`.

**`SESSION_SECRET is not set`** — the app refuses to boot in production without it,
rather than signing sessions with an empty key. Add the variable and redeploy.

**Cover images save as blank** — the server only accepts image URLs it produced: a
`/uploads/…` path or an `https` URL on `*.public.blob.vercel-storage.com`. A cover from
any other host is discarded on save by design.

**Images return 400 from the optimizer** — `next.config.ts` allows exactly the blob
host and the `/uploads/**` path. A different storage provider needs its own
`remotePatterns` entry.

## Using a different host

Nothing here is Vercel-specific except the blob SDK. On a host with a persistent
writable disk (Fly.io, Railway, Render, a VPS), leave `BLOB_READ_WRITE_TOKEN` unset and
mount a volume at `public/uploads/` — uploads then work exactly as they do locally, and
a local SQLite file on the same volume works too, making both managed services optional.

For S3 or Cloudflare R2 instead of Vercel Blob, the only code to change is the
`usingBlobStorage()` branch in `src/lib/uploads.ts`. All the validation around it —
the auth check, size cap, and magic-byte sniffing — is storage-agnostic.
