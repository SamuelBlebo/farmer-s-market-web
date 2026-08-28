'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { sendMessageSchema, sendVoiceMessageSchema, startConversationSchema } from '@/lib/validation';
import { requireUser } from '@/server/authz';

export type ChatActionState = { error?: string };

/** Shared ownership check for anything that writes into a conversation. */
async function assertParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true, farmerId: true },
  });
  if (!conversation || (conversation.buyerId !== userId && conversation.farmerId !== userId)) return false;
  return true;
}

/**
 * Finds or creates the one continuing thread between the current user and the
 * other party, keyed by (buyerId, farmerId) regardless of who started it —
 * a buyer messaging from a listing and a farmer messaging from a Wanted
 * request both land in the same conversation. Returns the conversation id;
 * the caller navigates there itself rather than this action redirecting.
 */
export async function startConversation(otherUserId: string, productId?: string): Promise<string> {
  const user = await requireUser();
  const parsed = startConversationSchema.safeParse({ farmerUserId: otherUserId, productId });
  if (!parsed.success) throw new Error('Invalid request.');

  if (user.id === otherUserId) throw new Error("You can't message yourself.");

  const other = await prisma.user.findUnique({ where: { id: otherUserId }, select: { role: true } });
  if (!other) throw new Error('User not found.');

  let buyerId: string;
  let farmerId: string;
  if (user.role === 'BUYER' && other.role === 'FARMER') {
    buyerId = user.id;
    farmerId = otherUserId;
  } else if (user.role === 'FARMER' && other.role === 'BUYER') {
    buyerId = otherUserId;
    farmerId = user.id;
  } else {
    throw new Error('Chat is only between a buyer and a farmer.');
  }

  // A product id is just context for the thread, not something either
  // party can act on directly — but a fabricated or mismatched one would
  // still show up as "Re: <wrong farmer's listing>" in the UI, so it's
  // worth confirming the product is real, belongs to this exact farmer,
  // and is actually a listing buyers can see before attaching it.
  let validProductId: string | undefined;
  if (parsed.data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { moderation: true, status: true, farmer: { select: { userId: true } } },
    });
    if (product && product.moderation === 'APPROVED' && product.status !== 'REMOVED' && product.farmer.userId === farmerId) {
      validProductId = parsed.data.productId;
    }
  }

  const conversation = await prisma.conversation.upsert({
    where: { buyerId_farmerId: { buyerId, farmerId } },
    create: { buyerId, farmerId, productId: validProductId },
    update: validProductId ? { productId: validProductId } : {},
  });

  revalidatePath('/messages');
  return conversation.id;
}

export async function sendMessage(_prev: ChatActionState, formData: FormData): Promise<ChatActionState> {
  const user = await requireUser();
  const parsed = sendMessageSchema.safeParse({
    conversationId: formData.get('conversationId'),
    content: formData.get('content'),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.content?.[0] ?? 'Type a message' };
  }

  if (!(await assertParticipant(parsed.data.conversationId, user.id))) {
    return { error: 'Conversation not found.' };
  }

  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: parsed.data.conversationId, senderId: user.id, content: parsed.data.content },
    }),
    prisma.conversation.update({
      where: { id: parsed.data.conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  revalidatePath('/messages');
  return {};
}

/** Called directly from the recorder, not via a <form> — the audio is already uploaded to Cloudinary by the time this runs. */
export async function sendVoiceMessage(conversationId: string, audioUrl: string, durationSec: number): Promise<ChatActionState> {
  const user = await requireUser();
  const parsed = sendVoiceMessageSchema.safeParse({ conversationId, audioUrl, durationSec });
  if (!parsed.success) return { error: 'Could not send that voice note.' };

  if (!(await assertParticipant(parsed.data.conversationId, user.id))) {
    return { error: 'Conversation not found.' };
  }

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: parsed.data.conversationId,
        senderId: user.id,
        type: 'VOICE',
        content: 'Voice message',
        audioUrl: parsed.data.audioUrl,
        audioDurationSec: parsed.data.durationSec,
      },
    }),
    prisma.conversation.update({
      where: { id: parsed.data.conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  revalidatePath('/messages');
  return {};
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const user = await requireUser();
  if (!(await assertParticipant(conversationId, user.id))) return;

  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath('/messages');
}
