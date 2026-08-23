# Farmers Market — web

A produce marketplace for Ghana. Farmers list what they have; buyers find it and
message the farmer on WhatsApp. No internal chat, no payments, no logistics.

## Stack

Next.js 14 (App Router) · TypeScript · PostgreSQL · Prisma · Tailwind ·
Auth.js v5 (credentials) · Cloudinary for photos.

## Run it locally

```bash
cp .env.example .env          # then fill in the values
npm install
docker run --name fm-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
npx prisma migrate dev --name init
npm run db:seed
npm run dev                   # http://localhost:3000
```

## Environment variables

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Session signing key — `npx auth secret` |
| `AUTH_URL` | Base URL, `http://localhost:3000` in dev |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Unsigned preset for browser uploads |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Server-side Cloudinary credentials |
| `NEXT_PUBLIC_PLATFORM_NAME` | Name used in the pre-filled WhatsApp message |

Photos upload straight from the browser to Cloudinary with an unsigned preset, so
images never pass through the server — it matters on mobile data.

## Seed credentials

Password for every seeded account: `password123`

| Role | Email |
| --- | --- |
| Admin | `admin@farmersmarket.gh` |
| Farmer (verified) | `kofi@farmersmarket.gh` |
| Farmer (pending) | `yaa@farmersmarket.gh` |
| Farmer (unverified) | `ama@farmersmarket.gh` |
| Buyer | `eric@mensahfoods.gh` |

The seed creates 10 farmers, 6 buyers, 34 listings across 12 Ghanaian towns,
6 wanted requests and 2 open reports. Three listings sit in the approval queue
so the admin dashboard has something to act on.

## Routes

| Route | Who | What |
| --- | --- | --- |
| `/` | anyone | Marketplace — search, category, region, price, verified-only, sort |
| `/products/[id]` | anyone | Listing detail, WhatsApp contact, save, report |
| `/farmers/[id]` | anyone | Farmer profile and their active listings |
| `/wanted` | anyone | Buyer requests, contact buyer on WhatsApp |
| `/wanted/new` | buyer | Post a request |
| `/dashboard` | farmer | Their listings — edit, pause, mark sold |
| `/dashboard/listings/new` | farmer | Post produce |
| `/dashboard/listings/[id]/edit` | owner only | Edit a listing |
| `/admin` | admin | Approvals, verification, reports, categories |
| `/login`, `/register` | anyone | Auth |
| `/api/products`, `/api/products/[id]`, `/api/categories`, `/api/wanted` | anyone | Read-only JSON for the Expo app |

## How auth works

Auth.js v5 with a credentials provider and bcrypt hashes, JWT sessions carrying
`id` and `role`. `middleware.ts` is a first gate only — every server action
re-checks the session with the helpers in `src/server/authz.ts`:

- `requireFarmerProfile()` / `requireBuyerProfile()` — role plus an existing profile
- `requireAdmin()` — admin-only operations
- `assertOwnsProduct(id)` — a farmer can only touch their own listings; admins can touch any

Roles never come from the client. `register` accepts `FARMER` or `BUYER` only, so
`ADMIN` cannot be self-assigned — promote an admin directly in the database.

## How money and quantity are stored

Prices are integer pesewas (`priceMinor`), never floats. `initialQty` is kept
alongside `quantity` so listing cards can show how much of the original lot is
left — the thing wholesalers scan for first.

## Listing lifecycle

`moderation`: PENDING → APPROVED / REJECTED (admin).
`status`: ACTIVE / PAUSED / SOLD (farmer), REMOVED (admin only).
The marketplace query returns `status: ACTIVE` **and** `moderation: APPROVED`, and
nothing else in the app bypasses that query.

## Testing the flows

1. Register as a farmer → post produce → it shows "Awaiting approval" on the dashboard, and is absent from `/`.
2. Sign in as admin → `/admin` → approve it → it appears in the marketplace.
3. Sign out → open the listing → tap Contact on WhatsApp → check the pre-filled text.
4. As the farmer, pause it → gone from `/`, still on the dashboard. Unpause → back.
5. Sign in as a second farmer and open `/dashboard/listings/<first farmer's id>/edit` → the ownership check throws.
6. As a buyer, post a wanted request → it appears on `/wanted` with a working buyer contact link.
7. Report a listing as a buyer → it shows in the admin report queue → remove it → it leaves the marketplace.

## V2

Orders and quotes, reviews after a completed deal, saved-search alerts when
matching produce is posted, listing expiry with a "still available?" nudge,
phone-OTP signup, a price board computed from listings, and token auth so the
Expo app can post listings natively.
