# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router entry; `page.tsx` renders the main UI, `layout.tsx` is the shell, server actions live in `app/actions/`, and `app/api/stream/route.ts` serves streaming responses.
- `components/`: Shared UI. Shadcn primitives sit in `components/ui/`; feature pieces (`video-list`, `video-player`, `sync-button`) compose them.
- `lib/`: Shared logic. `prisma.ts` bootstraps the client, `constants.ts` reads env defaults (e.g., `VIDEO_ROOT`), `utils.ts` holds Tailwind helpers, and generated Prisma types live in `lib/generated/prisma`.
- `prisma/`: Schema, migrations, and local SQLite (`prisma/dev.db`); `prisma.config.ts` reads `DATABASE_URL`.
- `public/`: Static assets; `components.json` configures shadcn aliases.

## Build, Test, and Development Commands
```bash
npm run dev                         # Dev server on :3000
npm run build && npm run start      # Production build then serve
npm run lint                        # ESLint (Next core-web-vitals)
npx prisma migrate dev --name <msg> # Create/apply migration
npx prisma generate                 # Refresh Prisma client after schema edits
```
Set `DATABASE_URL` (e.g., `file:./prisma/dev.db`) before running; override the video folder with `VIDEO_ROOT=/abs/path`.

## Coding Style & Naming Conventions
- TypeScript with strict settings; prefer server components unless interactivity is needed.
- Kebab-case filenames, PascalCase component exports, camelCase helpers; import with the `@/` alias.
- Tailwind v4 utilities and `class-variance-authority` for variants; merge classes with `cn`.
- Two-space indent, double quotes, and the existing no-semicolon style; `npm run lint -- --fix` cleans up.

## Testing Guidelines
- No suite yet; always run `npm run lint` before PRs.
- Add colocated `<name>.test.ts(x)` files covering server actions, Prisma queries, and interactive components using deterministic fixtures.

## Commit & Pull Request Guidelines
- History is sparse; use short, imperative subjects (optional `feat:`/`fix:`) and focused commits.
- PRs should describe intent, schema/env impacts, and linked issues; add UI screenshots when relevant and call out required steps (`prisma migrate dev`, `VIDEO_ROOT` expectations).
- Validate with `npm run lint` and, when changes are broad, `npm run build` before review.

## Security & Configuration
- Keep `.env*` untracked; set `DATABASE_URL` and ensure `VIDEO_ROOT` is readable.
- After editing `prisma/schema.prisma`, run `npx prisma generate` so `lib/generated/prisma` stays aligned.
