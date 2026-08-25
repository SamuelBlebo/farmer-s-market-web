'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { normalizeGhanaPhone } from '@/lib/format';
import {
  adminProfileSchema,
  buyerProfileSchema,
  changePasswordSchema,
  farmerProfileSchema,
} from '@/lib/validation';
import { requireAdmin, requireBuyerProfile, requireFarmerProfile, requireUser } from '@/server/authz';

export type AccountState = { error?: string; fieldErrors?: Record<string, string[]> };

/** Throws a field error rather than a generic one when the phone belongs to someone else. */
async function phoneConflict(phone: string, ownerId: string) {
  const existing = await prisma.user.findUnique({ where: { phone } });
  return Boolean(existing && existing.id !== ownerId);
}

async function emailConflict(email: string, ownerId: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  return Boolean(existing && existing.id !== ownerId);
}

export async function updateFarmerProfile(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const { user, profile } = await requireFarmerProfile();
  const parsed = farmerProfileSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    businessName: String(formData.get('businessName') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
    region: formData.get('region'),
    town: String(formData.get('town') ?? ''),
    image: String(formData.get('image') ?? ''),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const normalizedPhone = normalizeGhanaPhone(d.phone);
  if (await phoneConflict(normalizedPhone, user.id)) return { error: 'That phone number is already in use.' };
  if (d.email && (await emailConflict(d.email, user.id))) return { error: 'That email is already in use.' };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: d.name, phone: normalizedPhone, email: d.email ?? null, image: d.image ?? null },
    }),
    prisma.farmerProfile.update({
      where: { id: profile.id },
      data: { farmName: d.businessName, region: d.region, town: d.town, phone: d.phone, whatsapp: d.phone },
    }),
  ]);

  revalidatePath('/account');
  redirect('/account?saved=1');
}

export async function updateBuyerProfile(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const { user, profile } = await requireBuyerProfile();
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
  if (await phoneConflict(normalizedPhone, user.id)) return { error: 'That phone number is already in use.' };
  if (d.email && (await emailConflict(d.email, user.id))) return { error: 'That email is already in use.' };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: d.name, phone: normalizedPhone, email: d.email ?? null, image: d.image ?? null },
    }),
    prisma.buyerProfile.update({
      where: { id: profile.id },
      data: { businessName: d.businessName, phone: d.phone, whatsapp: d.phone },
    }),
  ]);

  revalidatePath('/account');
  redirect('/account?saved=1');
}

export async function updateAdminProfile(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireAdmin();
  const parsed = adminProfileSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? '').toLowerCase(),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const normalizedPhone = normalizeGhanaPhone(d.phone);
  if (await phoneConflict(normalizedPhone, user.id)) return { error: 'That phone number is already in use.' };
  if (await emailConflict(d.email, user.id)) return { error: 'That email is already in use.' };

  await prisma.user.update({
    where: { id: user.id },
    data: { name: d.name, phone: normalizedPhone, email: d.email },
  });

  revalidatePath('/account');
  redirect('/account?saved=1');
}

export async function changePassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get('currentPassword') ?? ''),
    newPassword: String(formData.get('newPassword') ?? ''),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const ok = dbUser.passwordHash && (await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash));
  if (!ok) return { error: 'Current password is wrong.' };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  redirect('/account?passwordChanged=1');
}
