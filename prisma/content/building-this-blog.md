This site is a small Next.js app with a database behind it. Nothing here is novel, but a few of the decisions took some thought, so this is a record of what runs and why.

## The stack

- **Next.js 16** with the App Router, React 19, and TypeScript
- **Prisma 7** talking to a **SQLite** file through the LibSQL driver adapter
- **Tailwind CSS v4** for styling
- **jose** for session tokens, **bcryptjs** for password hashing

Two pieces do the real work: a public site that renders published posts, and an admin panel behind a login where those posts get written.

## Why SQLite

There is no database server to start, no connection string to manage, no container to remember. The whole thing is a file — `prisma/dev.db` — and backing it up means copying that file somewhere else.

The tradeoff is real. SQLite writes to a local disk, which rules out serverless hosts with ephemeral filesystems. But that is a deployment problem rather than a development one, and swapping the datasource for Postgres later is a contained change. Deferring it was worth the speed.

## Rendering markdown without trusting HTML

Posts are stored as markdown. The obvious way to render them is to convert the markdown into an HTML string and drop it into the page with `dangerouslySetInnerHTML`. This site does not do that.

Instead the parser in `src/components/post-content.tsx` builds React elements directly. Text becomes text nodes, never markup. A post containing a `<script>` tag renders those characters visibly on the page instead of executing anything, and there is no sanitizer to keep up to date, because there is no HTML string to sanitize in the first place.

Link and image URLs get one extra check: only `http`, `https`, `mailto`, and relative paths pass through, so a `javascript:` URL is rewritten to an inert `#`.

> The most reliable way to avoid an injection bug is to never build the thing that could be injected into.

The same component renders the live preview in the editor. That means the preview cannot drift from the published page — they are not two implementations that happen to agree, they are one implementation used twice.

## Images

Cropping happens in the browser before anything is uploaded. Drag out a region and only that region is drawn to a canvas and sent; the rest of the file never leaves the machine. Wide images are scaled down to 2000px on the way out, so a photo straight off a camera does not become a multi-megabyte download for every reader.

The upload endpoint is the part I would defend hardest:

1. It requires a signed-in admin. Uploads write to disk, so this is not optional.
2. It identifies files by their **magic bytes**, not by the `Content-Type` header or the filename. A script renamed to `.jpg` and sent with an image MIME type is rejected, because its first bytes are not a JPEG's.
3. Filenames are server-generated UUIDs. Nothing the client sends reaches the filesystem path, which takes directory traversal off the table entirely.

## Auth

A signed JWT in an httpOnly cookie. `requireUser()` guards the admin layout and every server action that mutates data — every action, not just the layout, because server actions are reachable independently of the page that renders their form.

It is a single-admin setup. No signup, no password reset, no roles. Adding those is straightforward; being sure they are needed is the part worth slowing down for.
