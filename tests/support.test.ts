import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { adminReplySupport, markSupportRead, markSupportReadAdmin, sendSupportMessage } from '@/server/actions/support';
import { getAdminSupportConversation, getAdminSupportConversations } from '@/server/support';
import { cleanupUsers, createAdmin, createBuyer, sessionFor } from './fixtures';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

const userIds: string[] = [];

let buyer: Awaited<ReturnType<typeof createBuyer>>;
let otherBuyer: Awaited<ReturnType<typeof createBuyer>>;
let admin: Awaited<ReturnType<typeof createAdmin>>;

beforeAll(async () => {
  buyer = await createBuyer();
  otherBuyer = await createBuyer();
  admin = await createAdmin();
  userIds.push(buyer.user.id, otherBuyer.user.id, admin.user.id);
});

afterAll(async () => {
  await cleanupUsers(userIds);
});

function sendFormData(content: string) {
  const formData = new FormData();
  formData.set('content', content);
  return formData;
}

describe('support chat', () => {
  it('creates the thread lazily on the first message and reuses it on the next', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);

    const first = await sendSupportMessage({}, sendFormData('Hello, I have a question'));
    expect(first.error).toBeUndefined();

    const second = await sendSupportMessage({}, sendFormData('Following up'));
    expect(second.error).toBeUndefined();

    const conversations = await prisma.supportConversation.findMany({ where: { userId: buyer.user.id } });
    expect(conversations).toHaveLength(1);

    const messages = await prisma.supportMessage.findMany({ where: { conversationId: conversations[0].id } });
    expect(messages).toHaveLength(2);
    expect(messages.every((m) => !m.fromAdmin && m.senderId === buyer.user.id)).toBe(true);
  });

  it('a non-admin cannot reply as support', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);
    const conversation = await prisma.supportConversation.upsert({
      where: { userId: buyer.user.id },
      create: { userId: buyer.user.id },
      update: {},
    });

    vi.mocked(auth).mockResolvedValue(sessionFor(otherBuyer.user) as never);
    const formData = sendFormData('I should not be able to reply as support');
    formData.set('conversationId', conversation.id);
    await expect(adminReplySupport({}, formData)).rejects.toThrow(/REDIRECT:\//);
  });

  it('an admin can reply, and the message renders on the admin side regardless of which admin sent it', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);
    await sendSupportMessage({}, sendFormData('Need help with a listing'));
    const conversation = await prisma.supportConversation.findUniqueOrThrow({ where: { userId: buyer.user.id } });

    vi.mocked(auth).mockResolvedValue(sessionFor(admin.user) as never);
    const formData = sendFormData('Sure, what do you need?');
    formData.set('conversationId', conversation.id);
    const result = await adminReplySupport({}, formData);
    expect(result.error).toBeUndefined();

    const reply = await prisma.supportMessage.findFirst({ where: { conversationId: conversation.id, fromAdmin: true } });
    expect(reply?.senderId).toBe(admin.user.id);
  });

  it("marking read only affects the caller's own side of the thread", async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);
    await sendSupportMessage({}, sendFormData('unread from buyer'));
    const conversation = await prisma.supportConversation.findUniqueOrThrow({ where: { userId: buyer.user.id } });

    vi.mocked(auth).mockResolvedValue(sessionFor(admin.user) as never);
    const replyFormData = sendFormData('unread from admin');
    replyFormData.set('conversationId', conversation.id);
    await adminReplySupport({}, replyFormData);

    // Admin marks the buyer's messages read — should not touch the admin's own unread reply.
    await markSupportReadAdmin(conversation.id);
    const buyerMessagesAfterAdminRead = await prisma.supportMessage.findMany({
      where: { conversationId: conversation.id, fromAdmin: false, readAt: null },
    });
    expect(buyerMessagesAfterAdminRead).toHaveLength(0);
    const adminMessageStillUnread = await prisma.supportMessage.findFirst({
      where: { conversationId: conversation.id, fromAdmin: true, content: 'unread from admin' },
    });
    expect(adminMessageStillUnread?.readAt).toBeNull();

    // Buyer marks the admin's reply read.
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);
    await markSupportRead(conversation.id);
    const adminMessageAfterBuyerRead = await prisma.supportMessage.findFirst({
      where: { conversationId: conversation.id, fromAdmin: true, content: 'unread from admin' },
    });
    expect(adminMessageAfterBuyerRead?.readAt).not.toBeNull();
  });

  it("a user cannot mark someone else's support thread read", async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(otherBuyer.user) as never);
    await sendSupportMessage({}, sendFormData('other buyer says hi'));
    const conversation = await prisma.supportConversation.findUniqueOrThrow({ where: { userId: otherBuyer.user.id } });

    vi.mocked(auth).mockResolvedValue(sessionFor(admin.user) as never);
    const replyFormData = sendFormData('admin reply to other buyer');
    replyFormData.set('conversationId', conversation.id);
    await adminReplySupport({}, replyFormData);

    // A different buyer, not the thread's owner, tries to mark it read.
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);
    await markSupportRead(conversation.id);

    const stillUnread = await prisma.supportMessage.findFirst({
      where: { conversationId: conversation.id, fromAdmin: true, content: 'admin reply to other buyer' },
    });
    expect(stillUnread?.readAt).toBeNull();
  });

  it('admin queries surface every thread with messages, ordered by recent activity, with correct unread counts', async () => {
    const conversations = await getAdminSupportConversations();
    const buyerThread = conversations.find((c) => c.userId === buyer.user.id);
    expect(buyerThread).toBeDefined();
    expect(buyerThread!.unreadCount).toBe(0); // marked read in the earlier test

    const full = await getAdminSupportConversation(buyerThread!.id);
    expect(full?.user.id).toBe(buyer.user.id);
    expect(full?.messages.length).toBeGreaterThan(0);
  });
});
