import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientIp, isRateLimited } from '@/lib/rate-limit';
import { currentUser } from '@/server/authz';
import { getNewSupportMessages } from '@/server/support';

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

/** Polling target for an open support thread — no persistent WebSocket support on this deployment target. */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  if (await isRateLimited(`support-poll:${clientIp(request.headers)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const conversation = await prisma.supportConversation.findUnique({ where: { id: params.id }, select: { userId: true } });
  if (!conversation || (conversation.userId !== user.id && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const after = new Date(new URL(request.url).searchParams.get('after') ?? 0);
  if (Number.isNaN(after.getTime())) return NextResponse.json({ error: 'Invalid after' }, { status: 400 });

  const messages = await getNewSupportMessages(params.id, after);
  return NextResponse.json({ messages });
}
