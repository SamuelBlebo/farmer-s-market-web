'use server';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { signIn, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation';

export type AuthState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    role: formData.get('role'),
    name: String(formData.get('name') ?? ''),
    businessName: String(formData.get('businessName') ?? ''),
    email: String(formData.get('email') ?? '').toLowerCase(),
    password: String(formData.get('password') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    whatsapp: String(formData.get('whatsapp') ?? '') || String(formData.get('phone') ?? ''),
    region: formData.get('region'),
    town: String(formData.get('town') ?? ''),
    description: String(formData.get('description') ?? '') || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const taken = await prisma.user.findUnique({ where: { email: d.email } });
  if (taken) return { error: 'That email already has an account. Sign in instead.' };

  const passwordHash = await bcrypt.hash(d.password, 12);

  // ADMIN is never self-assignable — the role comes from a closed enum of two.
  await prisma.user.create({
    data: {
      email: d.email,
      name: d.name,
      phone: d.phone,
      passwordHash,
      role: d.role,
      ...(d.role === 'FARMER'
        ? {
            farmerProfile: {
              create: {
                farmName: d.businessName,
                description: d.description,
                region: d.region,
                town: d.town,
                phone: d.phone,
                whatsapp: d.whatsapp,
                verification: 'UNVERIFIED',
              },
            },
          }
        : {
            buyerProfile: {
              create: {
                businessName: d.businessName,
                description: d.description,
                region: d.region,
                town: d.town,
                phone: d.phone,
                whatsapp: d.whatsapp,
              },
            },
          }),
    },
  });

  await signIn('credentials', {
    email: d.email,
    password: d.password,
    redirectTo: d.role === 'FARMER' ? '/dashboard' : '/',
  });
  return {};
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? '').toLowerCase(),
      password: String(formData.get('password') ?? ''),
      redirectTo: '/',
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) return { error: 'Email or password is wrong. Try again.' };
    throw err;
  }
}

export async function logout() {
  await signOut({ redirectTo: '/' });
  redirect('/');
}
