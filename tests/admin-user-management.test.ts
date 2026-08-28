import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { messageUserFromAdmin, updateBuyerProfileAsAdmin, updateFarmerProfileAsAdmin } from '@/server/actions/admin';
import { cleanupUsers, createAdmin, createBuyer, createFarmer, sessionFor } from './fixtures';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

const userIds: string[] = [];

let farmer: Awaited<ReturnType<typeof createFarmer>>;
let buyer: Awaited<ReturnType<typeof createBuyer>>;
let otherFarmer: Awaited<ReturnType<typeof createFarmer>>;
let admin: Awaited<ReturnType<typeof createAdmin>>;

beforeAll(async () => {
  farmer = await createFarmer();
  buyer = await createBuyer();
  otherFarmer = await createFarmer();
  admin = await createAdmin();
  userIds.push(farmer.user.id, buyer.user.id, otherFarmer.user.id, admin.user.id);
});

afterAll(async () => {
  await cleanupUsers(userIds);
});

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

describe('messageUserFromAdmin', () => {
  it('rejects a non-admin without creating a conversation', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);
    await expect(messageUserFromAdmin(formData({ userId: farmer.user.id }))).rejects.toThrow('REDIRECT:/');

    const conversations = await prisma.supportConversation.findMany({ where: { userId: farmer.user.id } });
    expect(conversations).toHaveLength(0);
  });

  it('an admin opening a thread creates it and redirects into the support inbox', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(admin.user) as never);
    await expect(messageUserFromAdmin(formData({ userId: farmer.user.id }))).rejects.toThrow(
      /^REDIRECT:\/admin\/support\?id=/,
    );

    const conversation = await prisma.supportConversation.findUniqueOrThrow({ where: { userId: farmer.user.id } });
    expect(conversation.userId).toBe(farmer.user.id);
  });

  it('messaging the same farmer again reuses the existing thread rather than creating a second one', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(admin.user) as never);
    await expect(messageUserFromAdmin(formData({ userId: farmer.user.id }))).rejects.toThrow(
      /^REDIRECT:\/admin\/support\?id=/,
    );

    const conversations = await prisma.supportConversation.findMany({ where: { userId: farmer.user.id } });
    expect(conversations).toHaveLength(1);
  });
});

describe('updateFarmerProfileAsAdmin', () => {
  it('rejects a non-admin, leaving the profile untouched', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);
    await expect(
      updateFarmerProfileAsAdmin(
        otherFarmer.profile.id,
        {},
        formData({
          name: 'Hijacked Name',
          businessName: 'Hijacked Farm',
          phone: '0244000111',
          email: '',
          region: 'Ashanti',
          town: 'Kumasi',
          image: '',
          coverImage: '',
        }),
      ),
    ).rejects.toThrow('REDIRECT:/');

    const stillOriginal = await prisma.farmerProfile.findUniqueOrThrow({ where: { id: otherFarmer.profile.id } });
    expect(stillOriginal.farmName).toBe(otherFarmer.profile.farmName);
  });

  it('an admin can update the farm name, location, and description', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(admin.user) as never);
    await expect(
      updateFarmerProfileAsAdmin(
        otherFarmer.profile.id,
        {},
        formData({
          name: otherFarmer.user.name,
          businessName: 'Renamed By Admin Farm',
          phone: otherFarmer.profile.phone,
          email: '',
          region: 'Northern',
          town: 'Tamale',
          image: '',
          coverImage: '',
          description: 'Updated by an admin on the farmer\'s behalf.',
        }),
      ),
    ).rejects.toThrow(/^REDIRECT:\/admin\/farmers\//);

    const updated = await prisma.farmerProfile.findUniqueOrThrow({ where: { id: otherFarmer.profile.id } });
    expect(updated.farmName).toBe('Renamed By Admin Farm');
    expect(updated.town).toBe('Tamale');
    expect(updated.region).toBe('Northern');
  });

  it('rejects a phone number already used by a different account', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(admin.user) as never);
    const result = await updateFarmerProfileAsAdmin(
      otherFarmer.profile.id,
      {},
      formData({
        name: otherFarmer.user.name,
        businessName: otherFarmer.profile.farmName,
        phone: farmer.user.phone,
        email: '',
        region: 'Ashanti',
        town: 'Kumasi',
        image: '',
        coverImage: '',
      }),
    );
    expect(result.error).toBe('That phone number is already in use.');
  });
});

describe('updateBuyerProfileAsAdmin', () => {
  it('rejects a non-admin, leaving the profile untouched', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(farmer.user) as never);
    await expect(
      updateBuyerProfileAsAdmin(
        buyer.profile.id,
        {},
        formData({ name: 'Hijacked', businessName: 'Hijacked Biz', phone: '0244000222', email: '', image: '' }),
      ),
    ).rejects.toThrow('REDIRECT:/');

    const stillOriginal = await prisma.buyerProfile.findUniqueOrThrow({ where: { id: buyer.profile.id } });
    expect(stillOriginal.businessName).toBe(buyer.profile.businessName);
  });

  it('an admin can update the business name', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(admin.user) as never);
    await expect(
      updateBuyerProfileAsAdmin(
        buyer.profile.id,
        {},
        formData({
          name: buyer.user.name,
          businessName: 'Renamed By Admin Business',
          phone: buyer.profile.phone,
          email: '',
          image: '',
        }),
      ),
    ).rejects.toThrow(/^REDIRECT:\/admin\/buyers\//);

    const updated = await prisma.buyerProfile.findUniqueOrThrow({ where: { id: buyer.profile.id } });
    expect(updated.businessName).toBe('Renamed By Admin Business');
  });
});
