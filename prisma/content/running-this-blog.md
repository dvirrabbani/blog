Getting from a fresh clone to a running site takes four commands. This is the whole process, including the parts that are not obvious from the file listing.

## Prerequisites

Node 20.19 or newer. That is genuinely it — no database server, no Docker, no external accounts to sign up for.

## Setup

Install dependencies:

```
npm install
```

The project reads a `.env` file at the root. For local development it holds four things:

- `DATABASE_URL` — the SQLite file path, normally `file:./dev.db`
- `SESSION_SECRET` — signs the session cookie, and should be regenerated for anything public
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` — the account the seed creates
- `ADMIN_NAME` — the byline shown under post titles

Create the database and apply the schema:

```
npm run db:migrate
```

Seed the admin account, the sample posts, and the example images:

```
npm run db:seed
```

Then start the dev server:

```
npm run dev
```

The blog is at `http://localhost:3000`, and the admin panel at `http://localhost:3000/admin`. Sign in with the email and password from `.env`.

## Writing a post

The editor is markdown with a toolbar, and a live preview beside it showing exactly what the published page will look like.

Select some text and press **B** to wrap it in `**`. Press **B** again to unwrap it — the toolbar buttons toggle rather than stacking markers up. `Ctrl+B`, `Ctrl+I`, and `Ctrl+K` are bound to bold, italic, and link. The preview can be hidden when the full width is more useful for writing.

Four fields are worth understanding:

1. **Slug** is optional. Left blank it is generated from the title, and a duplicate gets a numeric suffix instead of failing the save.
2. **Excerpt** is optional. Left blank it falls back to the first 160 characters of the post.
3. **Cover image** appears on the home page, at the top of the post, and as the preview card when the link is shared.
4. **Published** is a checkbox. Unchecked posts are drafts: they never appear on the public site, and visiting the URL directly returns a 404 rather than the draft.

Both image buttons open the same crop dialog, with presets for Free, 16:9, 4:3, 3:2, and 1:1. Covers default to 16:9 because that is the shape the home page expects. Inline images start free-form, since a portrait photo or a square screenshot is often exactly right mid-paragraph.

## Changing the admin password

Edit `ADMIN_PASSWORD` in `.env` and re-run the seed:

```
npm run db:seed
```

The seed upserts, so it updates the existing account without touching any posts.

## The other scripts

- `npm run build`, then `npm start` — production build and serve
- `npm run lint` — ESLint across the project
- `npm run db:studio` — browse and edit the database in a GUI

## Starting over

Delete `prisma/dev.db` and run the migrate and seed commands again. Uploaded images live in `public/uploads/` and are not touched by that, so clear the folder too if you want a genuinely clean slate.
