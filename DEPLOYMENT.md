# Deploying to Vercel

Standard Next.js App Router project — Vercel auto-detects the framework and
build command. No `vercel.json` is needed.

## 1. Database

Vercel's build environment is serverless — it does not persist a Postgres
instance for you. Provision one first:

- [Neon](https://neon.tech), [Supabase](https://supabase.com), or
  [Railway](https://railway.app) all work; any managed Postgres does.
- Serverless functions open a new connection per invocation, which can
  exhaust a small Postgres connection limit under load. If that becomes a
  problem, put a pooler (Neon's built-in pooler, or PgBouncer) in front and
  point `DATABASE_URL` at the pooled connection string.

## 2. Run the migration before the first deploy

Vercel's build step (`npm run build`) only runs `prisma generate` (regenerates
the client), **not** `prisma migrate deploy`. Apply the schema to the
production database yourself, once, before traffic hits it:

```bash
DATABASE_URL="<production connection string>" npx prisma migrate deploy
```

Run this from your machine or CI — not as part of the Vercel build — so a
bad migration can't take down a build that would otherwise have succeeded,
and so it only ever runs once per migration, not once per deploy.

Do **not** run `db:seed` against production — it clears existing data
(`prisma/seed.ts` starts with `deleteMany()` on every table). Seeding is a
local/dev-only script.

## 3. Environment variables (set in Vercel → Project → Settings → Environment Variables)

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | production Postgres connection string |
| `AUTH_SECRET` | generate with `npx auth secret` — a different value than any local `.env` |
| `AUTH_URL` | your production URL, e.g. `https://your-app.vercel.app` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | from the Cloudinary dashboard |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | the unsigned preset used for browser uploads |
| `CLOUDINARY_API_KEY` | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary dashboard — server-side only, never exposed to the browser |
| `NEXT_PUBLIC_PLATFORM_NAME` | shown in the pre-filled WhatsApp message |
| `NEXT_PUBLIC_SITE_URL` | the real production domain, e.g. `https://your-app.vercel.app` — used by `metadataBase`, Open Graph images, and the generated sitemap; left at the `localhost` default, those all point at the wrong place |

Anything without `NEXT_PUBLIC_` stays server-side only, which is why
`CLOUDINARY_API_SECRET` and `AUTH_SECRET` are safe to set here.

Once deployed, `/admin/system` (admin-only) shows live status for the
database, Cloudinary, and every variable in the table above — check it
after the first deploy instead of guessing from the Vercel dashboard.

## 4. Deploy

```bash
git push origin main
```

Then import the repo in Vercel (or it auto-deploys if already connected).
Vercel runs `npm install` then `npm run build` (`prisma generate && next build`).

## 5. Post-deploy checklist

- [ ] `prisma migrate deploy` has been run against the production database
- [ ] All 9 environment variables above are set for the Production environment
- [ ] `AUTH_URL` matches the actual deployed domain (auth callbacks break otherwise)
- [ ] Register a test farmer account, post a listing, confirm it's `PENDING`
- [ ] Promote your own account to `ADMIN` directly in the production database
      (registration only ever creates `FARMER` or `BUYER` — this is intentional,
      see `src/server/actions/auth.ts`) and approve the test listing
- [ ] Confirm the listing appears on `/`, and the WhatsApp button opens with
      the correct pre-filled message
- [ ] Confirm a real Cloudinary upload works from the deployed domain (some
      Cloudinary upload presets restrict allowed origins/referrers — check
      the preset's settings if uploads fail only in production)
