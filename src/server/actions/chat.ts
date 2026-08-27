'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { sendMessageSchema, startConversationSchema } from '@/lib/validation';
import { requireUser } from '@/server/authz';

export type ChatActionState = { error?: string };

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

  const conversation = await prisma.conversation.upsert({
    where: { buyerId_farmerId: { buyerId, farmerId } },
    create: { buyerId, farmerId, productId: parsed.data.productId },
    update: parsed.data.productId ? { productId: parsed.data.productId } : {},
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

  const conversation = await prisma.conversation.findUnique({
    where: { id: parsed.data.conversationId },
    select: { buyerId: true, farmerId: true },
  });
  if (!conversation || (conversation.buyerId !== user.id && conversation.farmerId !== user.id)) {
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

  revalidatePath(`/messages/${parsed.data.conversationId}`);
  revalidatePath('/messages');
  return {};
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const user = await requireUser();
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true, farmerId: true },
  });
  if (!conversation || (conversation.buyerId !== user.id && conversation.farmerId !== user.id)) return;

  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath('/messages');
}
