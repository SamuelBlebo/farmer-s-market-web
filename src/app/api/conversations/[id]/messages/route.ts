import { NextResponse } from 'next/server';
import { clientIp, isRateLimited } from '@/lib/rate-limit';
import { currentUser } from '@/server/authz';
import { getNewMessages } from '@/server/chat';

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

/** Polling target for an open thread — no persistent WebSocket support on this deployment target. */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  if (await isRateLimited(`messages-poll:${clientIp(request.headers)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const after = new Date(new URL(request.url).searchParams.get('after') ?? 0);
  if (Number.isNaN(after.getTime())) return NextResponse.json({ error: 'Invalid after' }, { status: 400 });

  const messages = await getNewMessages(params.id, user.id, after);
  return NextResponse.json({ messages });
}
