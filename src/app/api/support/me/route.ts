import { NextResponse } from 'next/server';
import { currentUser } from '@/server/authz';
import { getOrCreateSupportConversation } from '@/server/support';

/** Lazily creates/fetches the signed-in visitor's own support thread — the floating widget has no conversation id to hand until it's opened. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const conversation = await getOrCreateSupportConversation(user.id);
  return NextResponse.json({
    id: conversation.id,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      fromAdmin: m.fromAdmin,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt ? m.readAt.toISOString() : null,
    })),
  });
}
