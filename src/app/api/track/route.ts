import { NextResponse } from 'next/server';
import type { AnalyticsEventType } from '@prisma/client';
import { clientIp, isRateLimited } from '@/lib/rate-limit';
import { track } from '@/server/analytics';
import { currentUser } from '@/server/authz';

// Only click/search events originate client-side — page-view events are
// recorded server-side where the page already knows what it's rendering.
const CLIENT_EVENT_TYPES: AnalyticsEventType[] = ['WHATSAPP_CLICKED', 'CALL_CLICKED', 'SEARCH_PERFORMED'];
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  if (isRateLimited(`track:${clientIp(request.headers)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !CLIENT_EVENT_TYPES.includes(body.type)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const user = await currentUser();
  // Not awaited — the client already fires this with keepalive and doesn't wait on the response.
  track({
    type: body.type,
    userId: user?.id,
    entityId: typeof body.entityId === 'string' ? body.entityId : undefined,
    metadata: typeof body.metadata === 'string' ? body.metadata : undefined,
  });

  return NextResponse.json({ ok: true });
}
