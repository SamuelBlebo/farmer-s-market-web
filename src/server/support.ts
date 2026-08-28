import { prisma } from '@/lib/prisma';

const MESSAGE_SELECT = {
  id: true,
  senderId: true,
  fromAdmin: true,
  content: true,
  createdAt: true,
  readAt: true,
} as const;

/** The signed-in user's own support thread — created on first access so there's always something to render. */
export async function getOrCreateSupportConversation(userId: string) {
  const conversation = await prisma.supportConversation.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: { messages: { orderBy: { createdAt: 'asc' }, select: MESSAGE_SELECT } },
  });
  return conversation;
}

/** Polling target — messages that landed after the client's last-seen timestamp, for either side of the thread. */
export async function getNewSupportMessages(conversationId: string, after: Date) {
  return prisma.supportMessage.findMany({
    where: { conversationId, createdAt: { gt: after } },
    orderBy: { createdAt: 'asc' },
    select: MESSAGE_SELECT,
  });
}

export type SupportConversationSummary = {
  id: string;
  userId: string;
  userName: string;
  userRole: 'FARMER' | 'BUYER' | 'ADMIN';
  lastMessage: string | null;
  lastMessageAt: Date;
  unreadCount: number;
};

/** Admin inbox — every user's support thread that has at least one message, newest activity first. */
export async function getAdminSupportConversations(): Promise<SupportConversationSummary[]> {
  const conversations = await prisma.supportConversation.findMany({
    where: { messages: { some: {} } },
    orderBy: { lastMessageAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, role: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true } },
      _count: { select: { messages: { where: { readAt: null, fromAdmin: false } } } },
    },
  });

  return conversations.map((c) => ({
    id: c.id,
    userId: c.user.id,
    userName: c.user.name,
    userRole: c.user.role,
    lastMessage: c.messages[0]?.content ?? null,
    lastMessageAt: c.lastMessageAt,
    unreadCount: c._count.messages,
  }));
}

/** A single thread for the admin view — includes who the customer is. */
export async function getAdminSupportConversation(id: string) {
  const conversation = await prisma.supportConversation.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, role: true } },
      messages: { orderBy: { createdAt: 'asc' }, select: MESSAGE_SELECT },
    },
  });
  return conversation;
}

export async function getUnreadSupportCountForAdmin(): Promise<number> {
  return prisma.supportMessage.count({ where: { readAt: null, fromAdmin: false } });
}

export async function getUnreadSupportCountForUser(userId: string): Promise<number> {
  return prisma.supportMessage.count({
    where: { readAt: null, fromAdmin: true, conversation: { userId } },
  });
}

/**
 * Read-only peek for the pinned "Support" row in the inbox — never creates a
 * thread just because the user opened their messages, only once they
 * actually click into it (getOrCreateSupportConversation does that part).
 */
export async function getSupportConversationPreview(userId: string) {
  const conversation = await prisma.supportConversation.findUnique({
    where: { userId },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true } } },
  });
  if (!conversation) return null;

  const unreadCount = await prisma.supportMessage.count({
    where: { conversationId: conversation.id, fromAdmin: true, readAt: null },
  });

  return {
    id: conversation.id,
    lastMessage: conversation.messages[0]?.content ?? null,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount,
  };
}

/** For the notification feed — the actual reply, not just a count, so it can show a real timestamp and preview. */
export async function getLatestUnreadSupportReply(userId: string) {
  return prisma.supportMessage.findFirst({
    where: { fromAdmin: true, readAt: null, conversation: { userId } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, content: true, createdAt: true },
  });
}
