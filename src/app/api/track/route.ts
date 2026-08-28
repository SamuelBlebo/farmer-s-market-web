import { NextResponse } from 'next/server';
import type { AnalyticsEventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { clientIp, isRateLimited } from '@/lib/rate-limit';
import { track } from '@/server/analytics';
import { currentUser } from '@/server/authz';

// Only click/search events originate client-side — page-view events are
// recorded server-side where the page already knows what it's rendering.
const CLIENT_EVENT_TYPES: AnalyticsEventType[] = ['WHATSAPP_CLICKED', 'CALL_CLICKED', 'SEARCH_PERFORMED'];
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
// A real search box query is never anywhere near this long — anything
// longer is either a mistake or someone testing the boundary, not a
// query worth keeping analytics on.
const MAX_METADATA_LENGTH = 120;

/**
 * WhatsApp/Call clicks always originate from a product or farmer page and
 * carry that entity's id — a click on content that doesn't actually exist
 * isn't a real interaction worth recording, and an unchecked client-
 * supplied id would let anyone write arbitrary strings into analytics.
 */
async function isRealEntity(entityId: string): Promise<boolean> {
  const [product, farmer] = await Promise.all([
    prisma.product.findUnique({ where: { id: entityId }, select: { id: true } }),
    prisma.farmerProfile.findUnique({ where: { id: entityId }, select: { id: true } }),
  ]);
  return Boolean(product || farmer);
}

export async function POST(request: Request) {
  if (await isRateLimited(`track:${clientIp(request.headers)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !CLIENT_EVENT_TYPES.includes(body.type)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const entityId = typeof body.entityId === 'string' ? body.entityId : undefined;
  if (entityId && !(await isRealEntity(entityId))) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const metadata = typeof body.metadata === 'string' ? body.metadata.trim().slice(0, MAX_METADATA_LENGTH) : undefined;
  if (metadata !== undefined && metadata.length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const user = await currentUser();
  // Not awaited — the client already fires this with keepalive and doesn't wait on the response.
  track({ type: body.type, userId: user?.id, entityId, metadata });

  return NextResponse.json({ ok: true });
}
