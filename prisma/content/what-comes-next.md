The site works, which is a different thing from being finished. This is the honest list, roughly in the order I would tackle it.

## Things that are actually missing

**There are no tests.** Not one. Every change so far has been checked by hand in a browser, which held up because the surface is small and the same person made every change. That stops being true the moment either of those things changes. The markdown parser is the obvious place to start — pure functions in, elements out, which is about as testable as code gets.

**Deleting a post orphans its images.** The database row disappears; the files in `public/uploads/` stay forever. Nothing breaks, but the folder grows without bound. The fix is to scan post content for image URLs on delete and remove any file no longer referenced by any remaining post.

**The login has no rate limiting.** One admin account and unlimited password guesses is a poor combination. Even a crude per-address delay after a handful of failures would close most of the gap.

## Things that would make it nicer to use

- **Draft autosave.** Losing half a post to a stray navigation only needs to happen once to feel unacceptable.
- **Tags**, with pages listing posts by tag. The schema change is small; deciding where tags appear in the design is the harder half.
- **An RSS feed.** Cheap to build, and arguably the thing that makes a blog a blog rather than a website.
- **Search.** SQLite has full-text search built in, so this is less work than it sounds.
- **Pagination.** The home page currently loads every published post at once. Fine at six. Not fine at six hundred.

## What deployment will require

Two things block a serverless host, and they are the same shape:

1. **SQLite writes to a local file.** Switch the Prisma datasource to Postgres and swap the LibSQL adapter for `@prisma/adapter-pg`. The query code itself does not change.
2. **Uploads write to `public/uploads/`.** That directory is not writable at runtime on those platforms, and anything written there would not survive the next deploy. Point `saveUpload()` at an object store instead — S3, R2, Vercel Blob. The validation wrapped around it stays exactly as it is.

Neither is difficult. Both are considerably easier to do deliberately than to discover during an outage.

## Things I am not sure about

A dark mode toggle. The site already follows the system preference, and an explicit switch means persisting a choice and handling the flash before it applies. Worth doing only if the automatic behaviour turns out to be wrong often enough to irritate.

Multiple authors. Every piece of this would work with more than one user — sessions, the admin panel, the author relation already on posts. But real multi-user means invitations, roles, and password resets, and that is a feature, not an afternoon. Not until there is a second person.

> Most of this list is small. The tests are the single item that makes everything else on it safer to attempt.
