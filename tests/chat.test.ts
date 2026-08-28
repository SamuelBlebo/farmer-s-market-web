import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { markConversationRead, sendMessage, startConversation } from '@/server/actions/chat';
import { getConversation } from '@/server/chat';
import { anyCategoryId, cleanupUsers, createBuyer, createFarmer, createProduct, sessionFor } from './fixtures';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

const userIds: string[] = [];

let farmerA: Awaited<ReturnType<typeof createFarmer>>;
let farmerD: Awaited<ReturnType<typeof createFarmer>>;
let buyerB: Awaited<ReturnType<typeof createBuyer>>;
let buyerC: Awaited<ReturnType<typeof createBuyer>>;
let productOwnedByA: Awaited<ReturnType<typeof createProduct>>;
let productOwnedByD: Awaited<ReturnType<typeof createProduct>>;
let pendingProductOwnedByA: Awaited<ReturnType<typeof createProduct>>;

beforeAll(async () => {
  const categoryId = await anyCategoryId();
  farmerA = await createFarmer();
  farmerD = await createFarmer();
  buyerB = await createBuyer();
  buyerC = await createBuyer();
  userIds.push(farmerA.user.id, farmerD.user.id, buyerB.user.id, buyerC.user.id);

  productOwnedByA = await createProduct(farmerA.profile.id, categoryId, { moderation: 'APPROVED', status: 'ACTIVE' });
  productOwnedByD = await createProduct(farmerD.profile.id, categoryId, { moderation: 'APPROVED', status: 'ACTIVE' });
  pendingProductOwnedByA = await createProduct(farmerA.profile.id, categoryId, { moderation: 'PENDING' });
});

afterAll(async () => {
  await cleanupUsers(userIds);
});

describe('chat context integrity', () => {
  it('attaches the product when it genuinely belongs to the farmer being messaged', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyerB.user) as never);
    const conversationId = await startConversation(farmerA.user.id, productOwnedByA.id);
    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });
    expect(conversation.productId).toBe(productOwnedByA.id);
  });

  it("drops a product id that belongs to a different farmer than the one being messaged", async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyerC.user) as never);
    // Messaging farmer A, but pointing at farmer D's listing.
    const conversationId = await startConversation(farmerA.user.id, productOwnedByD.id);
    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });
    expect(conversation.productId).toBeNull();
  });

  it('drops a product id for a listing that is not publicly visible yet', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyerC.user) as never);
    const conversationId = await startConversation(farmerA.user.id, pendingProductOwnedByA.id);
    const conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });
    expect(conversation.productId).toBeNull();
  });
});

describe('chat participant checks', () => {
  it('an outsider cannot send into a conversation they are not part of', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyerB.user) as never);
    const conversationId = await startConversation(farmerA.user.id, productOwnedByA.id);

    vi.mocked(auth).mockResolvedValue(sessionFor(buyerC.user) as never);
    const formData = new FormData();
    formData.set('conversationId', conversationId);
    formData.set('content', 'I should not be able to send this');
    const result = await sendMessage({}, formData);
    expect(result.error).toBe('Conversation not found.');

    const messages = await prisma.message.findMany({ where: { conversationId } });
    expect(messages).toHaveLength(0);
  });

  it('a real participant can send', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyerB.user) as never);
    const conversationId = await startConversation(farmerA.user.id, productOwnedByA.id);

    const formData = new FormData();
    formData.set('conversationId', conversationId);
    formData.set('content', 'Is this still available?');
    const result = await sendMessage({}, formData);
    expect(result.error).toBeUndefined();

    const messages = await prisma.message.findMany({ where: { conversationId } });
    expect(messages.length).toBeGreaterThanOrEqual(1);
  });

  it("an outsider cannot mark someone else's conversation read", async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyerB.user) as never);
    const conversationId = await startConversation(farmerA.user.id, productOwnedByA.id);
    const sendFormData = new FormData();
    sendFormData.set('conversationId', conversationId);
    sendFormData.set('content', 'unread message');
    await sendMessage({}, sendFormData);

    vi.mocked(auth).mockResolvedValue(sessionFor(buyerC.user) as never);
    await markConversationRead(conversationId);

    const stillUnread = await prisma.message.findMany({ where: { conversationId, readAt: null } });
    expect(stillUnread.length).toBeGreaterThan(0);
  });

  it('getConversation returns null for a non-participant — same as a 404, no data leak', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyerB.user) as never);
    const conversationId = await startConversation(farmerA.user.id, productOwnedByA.id);

    const asOutsider = await getConversation(conversationId, buyerC.user.id);
    expect(asOutsider).toBeNull();

    const asParticipant = await getConversation(conversationId, buyerB.user.id);
    expect(asParticipant?.id).toBe(conversationId);
  });
});
