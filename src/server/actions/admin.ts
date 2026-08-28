'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { normalizeGhanaPhone } from '@/lib/format';
import { adminCreateFarmerSchema, buyerProfileSchema, farmerProfileSchema } from '@/lib/validation';
import { requireAdmin } from '@/server/authz';
import { notifyFollowers } from '@/server/notifications';
import { emailConflict, phoneConflict, type AccountState } from '@/server/actions/account';

export type AdminCreateFarmerState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  tempPassword?: string;
  farmerId?: string;
  farmName?: string;
};

/**
 * For farmers who reach the platform by phone call or (eventually) USSD
 * instead of registering themselves — an admin takes their details over
 * the phone and sets the account up on their behalf, same temp-password
 * relay pattern as adminResetPassword below.
 */
export async function adminCreateFarmer(_prev: AdminCreateFarmerState, formData: FormData): Promise<AdminCreateFarmerState> {
  await requireAdmin();
  const parsed = adminCreateFarmerSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    farmName: String(formData.get('farmName') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    whatsapp: String(formData.get('whatsapp') ?? '') || String(formData.get('phone') ?? ''),
    region: formData.get('region'),
    town: String(formData.get('town') ?? ''),
    description: String(formData.get('description') ?? '') || undefined,
    verified: formData.get('verified') === 'on',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const normalizedPhone = normalizeGhanaPhone(d.phone);
  const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existing) return { error: 'A user with that phone number already has an account.' };

  const tempPassword = randomBytes(6).toString('base64url');
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      name: d.name,
      phone: normalizedPhone,
      passwordHash,
      role: 'FARMER',
      farmerProfile: {
        create: {
          farmName: d.farmName,
          description: d.description,
          region: d.region,
          town: d.town,
          phone: d.phone,
          whatsapp: d.whatsapp,
          verification: d.verified ? 'VERIFIED' : 'UNVERIFIED',
          verifiedAt: d.verified ? new Date() : null,
        },
      },
    },
    include: { farmerProfile: true },
  });

  revalidatePath('/admin');
  return { success: true, tempPassword, farmerId: user.farmerProfile!.id, farmName: d.farmName };
}

export async function moderateProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('productId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  if (!['APPROVED', 'REJECTED'].includes(decision)) throw new Error('Invalid decision');

  const product = await prisma.product.update({
    where: { id },
    data: { moderation: decision as 'APPROVED' | 'REJECTED' },
    select: { id: true, name: true, farmer: { select: { userId: true, farmName: true } } },
  });

  // Covers both the full listing form and Quick Post — both create through
  // the same createProduct action, so approval is the one place a new
  // listing actually becomes visible and worth notifying followers about.
  if (decision === 'APPROVED') {
    await notifyFollowers(product.farmer.userId, {
      type: 'NEW_LISTING',
      productId: product.id,
      message: `${product.farmer.farmName} just listed ${product.name}.`,
    });
  }

  revalidatePath('/admin');
  revalidatePath('/');
}

export async function moderateWanted(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('wantedId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  if (!['APPROVED', 'REJECTED'].includes(decision)) throw new Error('Invalid decision');

  await prisma.wantedListing.update({
    where: { id },
    data: { moderation: decision as 'APPROVED' | 'REJECTED' },
  });

  revalidatePath('/admin');
  revalidatePath('/wanted');
}

export async function removeProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('productId') ?? '');
  await prisma.product.update({ where: { id }, data: { status: 'REMOVED' } });
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function toggleFeatured(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('productId') ?? '');
  const product = await prisma.product.findUnique({ where: { id }, select: { featured: true } });
  if (!product) throw new Error('Listing not found');

  await prisma.product.update({ where: { id }, data: { featured: !product.featured } });
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function setFarmerVerification(formData: FormData) {
  await requireAdmin();
  const farmerId = String(formData.get('farmerId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!['UNVERIFIED', 'PENDING', 'VERIFIED'].includes(status)) throw new Error('Invalid status');

  await prisma.farmerProfile.update({
    where: { id: farmerId },
    data: {
      verification: status as 'UNVERIFIED' | 'PENDING' | 'VERIFIED',
      verifiedAt: status === 'VERIFIED' ? new Date() : null,
    },
  });

  revalidatePath('/admin');
}

export async function resolveReport(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('reportId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!['DISMISSED', 'ACTIONED'].includes(status)) throw new Error('Invalid status');

  await prisma.report.update({
    where: { id },
    data: { status: status as 'DISMISSED' | 'ACTIONED', resolvedAt: new Date() },
  });

  revalidatePath('/admin');
}

export async function upsertCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('categoryId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const emoji = String(formData.get('emoji') ?? '').trim() || null;
  if (name.length < 2) throw new Error('Category needs a name');

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (id) await prisma.category.update({ where: { id }, data: { name, emoji } });
  else await prisma.category.create({ data: { name, slug, emoji } });

  revalidatePath('/admin');
  revalidatePath('/');
}

export async function toggleCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('categoryId') ?? '');
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new Error('Category not found');

  await prisma.category.update({ where: { id }, data: { active: !category.active } });
  revalidatePath('/admin');
}

export async function moderateReview(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('reviewId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  if (!['APPROVED', 'REJECTED'].includes(decision)) throw new Error('Invalid decision');

  const review = await prisma.review.update({
    where: { id },
    data: { moderation: decision as 'APPROVED' | 'REJECTED' },
    select: { farmerId: true },
  });

  revalidatePath('/admin');
  revalidatePath(`/farmers/${review.farmerId}`);
}

/**
 * The universal fallback for accounts with no email on file (email is
 * optional at registration) — self-service /forgot-password can't reach
 * them. Admin generates a temporary password here and relays it to the
 * user directly, same as everything else in this app that goes through a
 * human rather than automated delivery. Returns the plaintext once —
 * nothing is stored or logged anywhere beyond the hash.
 */
export async function adminResetPassword(userId: string): Promise<string> {
  await requireAdmin();
  const newPassword = randomBytes(6).toString('base64url');
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return newPassword;
}

export async function markFeedbackReviewed(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('feedbackId') ?? '');
  await prisma.feedback.update({ where: { id }, data: { status: 'REVIEWED' } });
  revalidatePath('/admin/feedback');
}

/** Admin editing a farmer's own profile fields — same schema/shape as the farmer's own /account/edit, just targeting an arbitrary farmerId instead of the caller's own profile. */
export async function updateFarmerProfileAsAdmin(farmerId: string, _prev: AccountState, formData: FormData): Promise<AccountState> {
  await requireAdmin();
  const profile = await prisma.farmerProfile.findUniqueOrThrow({ where: { id: farmerId } });
  const parsed = farmerProfileSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    businessName: String(formData.get('businessName') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
    region: formData.get('region'),
    town: String(formData.get('town') ?? ''),
    image: String(formData.get('image') ?? ''),
    coverImage: String(formData.get('coverImage') ?? ''),
    description: String(formData.get('description') ?? '') || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const normalizedPhone = normalizeGhanaPhone(d.phone);
  if (await phoneConflict(normalizedPhone, profile.userId)) return { error: 'That phone number is already in use.' };
  if (d.email && (await emailConflict(d.email, profile.userId))) return { error: 'That email is already in use.' };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: profile.userId },
      data: { name: d.name, phone: normalizedPhone, email: d.email ?? null, image: d.image ?? null },
    }),
    prisma.farmerProfile.update({
      where: { id: farmerId },
      data: {
        farmName: d.businessName,
        region: d.region,
        town: d.town,
        phone: d.phone,
        whatsapp: d.phone,
        coverImage: d.coverImage ?? null,
        description: d.description ?? null,
      },
    }),
  ]);

  revalidatePath('/admin');
  revalidatePath(`/farmers/${farmerId}`);
  redirect(`/admin/farmers/${farmerId}/edit?saved=1`);
}

/** Admin editing a buyer's own profile fields — same schema/shape as the buyer's own /account/edit. */
export async function updateBuyerProfileAsAdmin(buyerId: string, _prev: AccountState, formData: FormData): Promise<AccountState> {
  await requireAdmin();
  const profile = await prisma.buyerProfile.findUniqueOrThrow({ where: { id: buyerId } });
  const parsed = buyerProfileSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    businessName: String(formData.get('businessName') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
    image: String(formData.get('image') ?? ''),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const normalizedPhone = normalizeGhanaPhone(d.phone);
  if (await phoneConflict(normalizedPhone, profile.userId)) return { error: 'That phone number is already in use.' };
  if (d.email && (await emailConflict(d.email, profile.userId))) return { error: 'That email is already in use.' };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: profile.userId },
      data: { name: d.name, phone: normalizedPhone, email: d.email ?? null, image: d.image ?? null },
    }),
    prisma.buyerProfile.update({
      where: { id: buyerId },
      data: { businessName: d.businessName, phone: d.phone, whatsapp: d.phone },
    }),
  ]);

  revalidatePath('/admin');
  redirect(`/admin/buyers/${buyerId}/edit?saved=1`);
}

/** Admin "Message" button — opens (or starts) that user's support thread and drops the admin straight into the reply view. Reuses the support inbox rather than the buyer/farmer marketplace chat, since an admin messaging someone isn't a buyer/farmer conversation. */
export async function messageUserFromAdmin(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const conversation = await prisma.supportConversation.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  redirect(`/admin/support?id=${conversation.id}`);
}
