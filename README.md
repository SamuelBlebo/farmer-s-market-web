# Farmers Market — web

A produce marketplace for Ghana. Farmers list what they have; buyers find it and
reach the farmer directly — WhatsApp, phone, or in-app chat (text and voice
notes). No payments, no logistics.

## Stack

Next.js 14 (App Router) · TypeScript · PostgreSQL · Prisma · Tailwind ·
Auth.js v5 (credentials) · Cloudinary for photos.

Deploying? See [DEPLOYMENT.md](./DEPLOYMENT.md) for the Vercel checklist.

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
| `NEXT_PUBLIC_SITE_URL` | Absolute site URL — `metadataBase`, Open Graph images, and the generated sitemap all depend on this being the real domain in production |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional — shown on `/support`. Defaults to `support@farmersmarket.gh` |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | Optional — shown on `/support` as a WhatsApp button. Omitted entirely if unset |

Photos upload straight from the browser to Cloudinary with an unsigned preset, so
images never pass through the server — it matters on mobile data.

`/admin/system` (admin-only) checks the required variables above live, along with
a real database round-trip and a Cloudinary API ping — check it after every deploy
rather than guessing from the hosting dashboard.

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
| `/products/[id]` | anyone | Listing detail — chat, WhatsApp, and call contact, save, report |
| `/farmers/[id]` | anyone | Farmer profile and their active listings |
| `/wanted` | anyone | Buyer requests, contact buyer on WhatsApp or chat |
| `/wanted/new` | buyer | Post a request |
| `/messages` | signed in (farmer/buyer) | Chat inbox — split view (list + open thread) from 640px up, floating widget on narrower phones |
| `/favorites` | signed in | Listings you've saved |
| `/dashboard` | farmer | Their listings — edit, pause, mark sold |
| `/dashboard/listings/new` | farmer | Post produce |
| `/dashboard/listings/[id]/edit` | owner only | Edit a listing |
| `/admin` | admin | Approvals, verification, reports, categories |
| `/admin/listings/new` | admin | Post a listing on a farmer's behalf (phone/USSD intake) |
| `/admin/analytics` | admin | Marketplace insights and CSV exports |
| `/admin/feedback` | admin | Review submissions from the feedback widget and `/support` |
| `/admin/system` | admin | Live database/Cloudinary/env status, app version, and platform counts |
| `/admin/login` | anyone | Dedicated admin sign-in — never shows farmer/buyer copy |
| `/support` | anyone | Contact info, FAQ, and a "report a problem" form |
| `/login`, `/register` | anyone | Auth (email or phone) |
| `/api/products`, `/api/products/[id]`, `/api/categories`, `/api/wanted` | anyone | Read-only JSON for the Expo app |
| `/sitemap.xml`, `/robots.txt` | anyone | Generated from live data — approved listings, storefronts with active listings, categories |

## How auth works

Auth.js v5 with two Credentials providers, both bcrypt + JWT sessions carrying
`id` and `role`:

- `credentials` (email + password) — any role, including admin
- `phone-credentials` (phone + password) — farmers and buyers only; explicitly
  rejects a login attempt for an ADMIN account in `authorize()`, before the
  password is even checked
- `User.phone` is unique and stored normalized (`normalizeGhanaPhone`), so a
  phone typed with spaces/dashes still matches on login

This is password auth keyed by phone, **not** OTP/SMS verification — there's no
code sent to the phone. True passwordless phone auth (magic-link-style OTP)
would need an SMS provider such as Twilio Verify, Africa's Talking, or AWS SNS,
none of which are configured here.

`middleware.ts` is a first gate only — every server action re-checks the
session with the helpers in `src/server/authz.ts`:

- `requireFarmerProfile()` / `requireBuyerProfile()` — role plus an existing profile
- `requireAdmin()` — admin-only operations
- `assertOwnsProduct(id)` — a farmer can only touch their own listings; admins can touch any

Roles never come from the client. `register` accepts `FARMER` or `BUYER` only, so
`ADMIN` cannot be self-assigned — promote an admin directly in the database.
Unauthenticated access to `/admin/*` redirects to `/admin/login`, never the
farmer/buyer `/login` — see the `authorized()` callback in `src/auth.config.ts`.

`role` on the session is re-read from the database on every request in
`currentUser()`, not trusted from the JWT — a demotion (or any other role
change made directly in the database) takes effect on the very next request,
not whenever that user's session token next happens to refresh.

## In-app chat

An optional alternative to WhatsApp/phone contact, not a replacement — both
stay available everywhere. One continuing thread per buyer/farmer pair
(`Conversation`, keyed on `buyerId`/`farmerId`), with `productId` marking
whichever listing it's currently about. Supports text and voice notes
(recorded in the browser via `MediaRecorder`, uploaded to Cloudinary the same
unsigned way photos are). No moderation queue — it's private 1:1 messages
between two consenting parties, not public content.

Polling, not WebSockets — Vercel serverless functions can't hold a persistent
connection open, so `ConversationThread` polls `/api/conversations/[id]/messages`
every few seconds while a thread is open instead. `/messages` is a split view
(list + open thread side by side) from 640px up; below that, chat opens as a
floating modal instead of a full page. Every write (`startConversation`,
`sendMessage`, `markConversationRead`) re-checks that the caller is actually a
participant in that specific conversation before touching it.

## How money and quantity are stored

Prices are integer pesewas (`priceMinor`), never floats. `initialQty` is kept
alongside `quantity` so listing cards can show how much of the original lot is
left — the thing wholesalers scan for first.

## Listing lifecycle

`moderation`: PENDING → APPROVED / REJECTED (admin).
`status`: ACTIVE / PAUSED / SOLD (farmer), REMOVED (admin only).
The marketplace query returns `status: ACTIVE` **and** `moderation: APPROVED`, and
nothing else in the app bypasses that query.

`WantedListing` follows the identical `moderation` pattern (same enum, same
admin queue) alongside its own `status: OPEN | CLOSED`. `/wanted` only ever
returns `status: OPEN` **and** `moderation: APPROVED`; a buyer sees all their
own requests regardless of status via `getMyWanted`.

## Testing the flows

1. Register as a farmer → post produce → it shows "Awaiting approval" on the dashboard, and is absent from `/`.
2. Sign in as admin → `/admin` → approve it → it appears in the marketplace.
3. Sign out → open the listing → tap Contact on WhatsApp → check the pre-filled text.
4. As the farmer, pause it → gone from `/`, still on the dashboard. Unpause → back.
5. Sign in as a second farmer and open `/dashboard/listings/<first farmer's id>/edit` → the ownership check throws.
6. As a buyer, post a wanted request → it shows "Pending review" under Your requests, and is absent from the public `/wanted` list.
7. Sign in as admin → `/admin` → approve the request → it appears on `/wanted`. Reject a different one → it stays hidden, buyer still sees its status.
8. Report a listing as a buyer → it shows in the admin report queue → remove it → it leaves the marketplace.
9. Open a product → confirm Chat, WhatsApp, and Call Farmer all work — Chat opens a thread with the farmer, WhatsApp/Call use their real number.
10. Visit `/admin` signed out → redirected to `/admin/login`, not `/login`. Sign in as a farmer or buyer and try `/admin` → same redirect.
11. As a buyer, start a chat from a product → send a text message, then a voice note → both appear in the thread and in the farmer's inbox.
12. Sign in as the farmer in a second browser (or incognito) → reply from `/messages` → confirm it shows up for the buyer within a few seconds (polling, not push).

## V2

Orders and quotes, saved-search alerts when matching produce is posted,
listing expiry with a "still available?" nudge, true OTP/SMS phone
verification (needs an SMS provider — Twilio Verify, Africa's Talking, or AWS
SNS), a price board computed from listings, real-time chat delivery (push
instead of polling — needs a WebSocket-capable host, which Vercel serverless
isn't), and token auth so the Expo app can post listings and chat natively.

Already shipped since the original scope: buyer reviews of a farmer (with a
moderation queue, same pattern as listings), and in-app chat with voice notes.
