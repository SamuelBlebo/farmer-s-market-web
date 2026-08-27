'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/authz';
import { notifyFollowers } from '@/server/notifications';

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

export async function markFeedbackReviewed(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('feedbackId') ?? '');
  await prisma.feedback.update({ where: { id }, data: { status: 'REVIEWED' } });
  revalidatePath('/admin/feedback');
}
