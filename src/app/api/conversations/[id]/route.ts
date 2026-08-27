import { NextResponse } from 'next/server';
import { currentUser } from '@/server/authz';
import { getConversation } from '@/server/chat';

/** Backs the floating chat widget's initial load — full thread detail for one conversation. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const conversation = await getConversation(params.id, user.id);
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: conversation.id,
    viewerId: user.id,
    otherId: conversation.otherId,
    otherName: conversation.otherName,
    otherAvatar: conversation.otherAvatar,
    otherFarmerProfileId: conversation.otherFarmerProfileId,
    product: conversation.product ? { id: conversation.product.id, name: conversation.product.name } : null,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt ? m.readAt.toISOString() : null,
    })),
  });
}
