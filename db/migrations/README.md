# db/migrations/

This folder holds schema changes made AFTER the `db/schema.sql` baseline
(dated 2026-06-21). It is currently empty — that's correct, nothing has
changed since the baseline was captured.

## Convention

- One file per change: `NNN_short_description.sql`, numbered sequentially
  starting from `001`.
- Each statement should be idempotent where practical (`IF NOT EXISTS`,
  `IF EXISTS`, etc.) so a migration is safe to re-run if needed.
- A migration file must be committed in the SAME commit as the
  application code that depends on it — never as a standalone zip or a
  loose file applied to Neon without a matching code change in git. This
  is the specific discipline gap that caused real bugs earlier in this
  project (a schema change existed in a zip, disconnected from git, with
  no confirmed link between "applied to Neon" and "committed to code").
- Apply the migration to Neon as part of the same deploy step that ships
  the dependent code — not before, not after, not "whenever convenient."

## What this project deliberately does NOT use

No ORM (Prisma, Drizzle) and no migration framework (node-pg-migrate,
Flyway, etc.). Every query in this codebase is raw SQL via a single
`neon()` tagged-template client (see `lib/db.js`). Introducing a
migration framework would fight that established, deliberate,
minimal-dependency style for a single-maintainer project that has so far
changed schema only a handful of times. Plain numbered `.sql` files are
the right amount of process here — enough to stop losing track of schema
state, not so much that it adds a new tool and build step for marginal
benefit.

## When to "flatten" back into db/schema.sql

Periodically (e.g. once migrations/ has accumulated 5-10 files, or before
a major feature push), regenerate `db/schema.sql` as a fresh baseline
reflecting all applied migrations, and clear this folder out. This keeps
the baseline file actually readable as a single source of truth instead
of requiring readers to mentally replay a long migration history.
