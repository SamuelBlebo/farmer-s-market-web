import { prisma } from '@/lib/prisma';

const PARTICIPANT_SELECT = {
  buyer: { select: { id: true, name: true, image: true, buyerProfile: { select: { businessName: true } } } },
  farmer: { select: { id: true, name: true, image: true, farmerProfile: { select: { id: true, farmName: true } } } },
} as const;

/** Farm name for the farmer side, business name for the buyer side — same identity shown everywhere else in the app, never the personal name. */
function displayName(user: { name: string; farmerProfile?: { farmName: string } | null; buyerProfile?: { businessName: string } | null }) {
  return user.farmerProfile?.farmName ?? user.buyerProfile?.businessName ?? user.name;
}

export type ConversationSummary = {
  id: string;
  otherId: string;
  otherFarmerProfileId: string | null;
  otherName: string;
  otherAvatar: string | null;
  productName: string | null;
  lastMessage: string | null;
  lastMessageAt: Date;
  unreadCount: number;
};

/** Inbox list — every conversation this user is part of, either side, newest activity first. */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: userId }, { farmerId: userId }] },
    orderBy: { lastMessageAt: 'desc' },
    include: {
      ...PARTICIPANT_SELECT,
      product: { select: { name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true } },
      _count: { select: { messages: { where: { readAt: null, NOT: { senderId: userId } } } } },
    },
  });

  return conversations.map((c) => {
    const isBuyer = c.buyerId === userId;
    const other = isBuyer ? c.farmer : c.buyer;
    return {
      id: c.id,
      otherId: other.id,
      otherFarmerProfileId: isBuyer ? c.farmer.farmerProfile?.id ?? null : null,
      otherName: displayName(other),
      otherAvatar: other.image,
      productName: c.product?.name ?? null,
      lastMessage: c.messages[0]?.content ?? null,
      lastMessageAt: c.lastMessageAt,
      unreadCount: c._count.messages,
    };
  });
}

/** A single thread, ownership-checked — returns null for a conversation this user isn't part of, same as a 404. */
export async function getConversation(id: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      ...PARTICIPANT_SELECT,
      product: { select: { id: true, name: true, images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } } } },
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, senderId: true, content: true, createdAt: true, readAt: true },
      },
    },
  });
  if (!conversation || (conversation.buyerId !== userId && conversation.farmerId !== userId)) return null;

  const isBuyer = conversation.buyerId === userId;
  const other = isBuyer ? conversation.farmer : conversation.buyer;

  return {
    ...conversation,
    otherId: other.id,
    otherFarmerProfileId: isBuyer ? conversation.farmer.farmerProfile?.id ?? null : null,
    otherName: displayName(other),
    otherAvatar: other.image,
  };
}

/** Polling target — messages that landed after the client's last-seen timestamp. */
export async function getNewMessages(conversationId: string, userId: string, after: Date) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { buyerId: true, farmerId: true },
  });
  if (!conversation || (conversation.buyerId !== userId && conversation.farmerId !== userId)) return [];

  return prisma.message.findMany({
    where: { conversationId, createdAt: { gt: after } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, senderId: true, content: true, createdAt: true, readAt: true },
  });
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: { OR: [{ buyerId: userId }, { farmerId: userId }] },
    },
  });
}
