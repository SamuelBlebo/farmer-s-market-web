'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { adminReplySupportSchema, sendSupportMessageSchema } from '@/lib/validation';
import { requireAdmin, requireUser } from '@/server/authz';

export type SupportActionState = { error?: string };

/** Customer side — always writes into the caller's own thread, creating it on first message. */
export async function sendSupportMessage(_prev: SupportActionState, formData: FormData): Promise<SupportActionState> {
  const user = await requireUser();
  const parsed = sendSupportMessageSchema.safeParse({ content: formData.get('content') });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.content?.[0] ?? 'Type a message' };
  }

  const conversation = await prisma.supportConversation.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: { conversationId: conversation.id, senderId: user.id, content: parsed.data.content },
    }),
    prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  revalidatePath('/admin/support');
  return {};
}

export async function adminReplySupport(_prev: SupportActionState, formData: FormData): Promise<SupportActionState> {
  const admin = await requireAdmin();
  const parsed = adminReplySupportSchema.safeParse({
    conversationId: formData.get('conversationId'),
    content: formData.get('content'),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.content?.[0] ?? 'Type a message' };
  }

  const conversation = await prisma.supportConversation.findUnique({ where: { id: parsed.data.conversationId } });
  if (!conversation) return { error: 'Conversation not found.' };

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: { conversationId: conversation.id, senderId: admin.id, fromAdmin: true, content: parsed.data.content },
    }),
    prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  revalidatePath('/admin/support');
  return {};
}

/** Customer marking the admin's replies as read. */
export async function markSupportRead(conversationId: string): Promise<void> {
  const user = await requireUser();
  const conversation = await prisma.supportConversation.findUnique({ where: { id: conversationId }, select: { userId: true } });
  if (!conversation || conversation.userId !== user.id) return;

  await prisma.supportMessage.updateMany({
    where: { conversationId, fromAdmin: true, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath('/');
}

/** Admin marking a customer's messages as read. */
export async function markSupportReadAdmin(conversationId: string): Promise<void> {
  await requireAdmin();
  await prisma.supportMessage.updateMany({
    where: { conversationId, fromAdmin: false, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath('/admin/support');
}
