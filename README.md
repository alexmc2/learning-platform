# Learning Platform

Next.js App Router project for local and Jellyfin videos with Supabase auth + Prisma for persistence.

![alt text](/public/image2.png)

![alt text](/public/image3.png)

![alt text](/public/image.png)

## Prerequisites
- Node.js 20+
- Supabase project (session pooler for IPv4)
- A `prisma` DB role with access to the `public` schema (see Supabase SQL below)

## Environment
Copy `.env.example` to `.env.local` and set:
- `DATABASE_URL` — Supabase session pooler string using the `prisma` role
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional: `VIDEO_ROOT` if you want a default local folder for manual syncs (leave unset if only using Jellyfin/remote)

Supabase SQL to create the Prisma role:
```sql
create user "prisma" with password '<DB_PASSWORD>' bypassrls createdb;
grant "prisma" to "postgres";
grant usage, create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

## Prisma
- Schema: `prisma/schema.prisma` (Postgres)
- Generate client: `npx prisma generate --config prisma.config.ts`
- Apply migration: `npx prisma migrate dev --config prisma.config.ts --name init`

## Commands
- `npm run dev` — start Next.js on port 3000
- `npm run build && npm run start` — production build + serve
- `npm run lint` — lint with Next.js config

## Features
- Supabase auth with login/logout
- Save current library/Jellyfin import as a course (manual “Save course” modal)
- My Courses page (`/courses`) with progress summaries and resume links
- Per-user video progress stored in Supabase via Prisma






