'use server';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { signIn, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import { normalizeGhanaPhone } from '@/lib/format';
import { registerSchema, phoneLoginSchema } from '@/lib/validation';

export type AuthState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    role: formData.get('role'),
    name: String(formData.get('name') ?? ''),
    businessName: String(formData.get('businessName') ?? ''),
    email: String(formData.get('email') ?? '').toLowerCase() || undefined,
    password: String(formData.get('password') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    whatsapp: String(formData.get('whatsapp') ?? '') || String(formData.get('phone') ?? ''),
    region: formData.get('region'),
    town: String(formData.get('town') ?? ''),
    description: String(formData.get('description') ?? '') || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const normalizedPhone = normalizeGhanaPhone(d.phone);

  if (d.email) {
    const taken = await prisma.user.findUnique({ where: { email: d.email } });
    if (taken) return { error: 'That email already has an account. Sign in instead.' };
  }

  const phoneTaken = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (phoneTaken) return { error: 'That phone number already has an account. Sign in instead.' };

  const passwordHash = await bcrypt.hash(d.password, 12);

  // ADMIN is never self-assignable — the role comes from a closed enum of two.
  await prisma.user.create({
    data: {
      email: d.email,
      name: d.name,
      // Stored normalized so phone sign-in can look it up reliably regardless
      // of how the farmer/buyer typed it in.
      phone: normalizedPhone,
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

  // Phone is always present at this point (email may not be), so sign in with
  // the phone provider — same as the phone tab on /login.
  await signIn('phone-credentials', {
    phone: d.phone,
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

export async function loginWithPhone(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = phoneLoginSchema.safeParse({
    phone: String(formData.get('phone') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await signIn('phone-credentials', {
      phone: parsed.data.phone,
      password: parsed.data.password,
      redirectTo: '/',
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) return { error: 'Phone number or password is wrong. Try again.' };
    throw err;
  }
}

/** Admin-only sign-in — same credentials provider, fixed destination. The
 * phone provider explicitly rejects admin accounts, so this is the only path in. */
export async function loginAdmin(_prev: AuthState, formData: FormData): Promise<AuthState> {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? '').toLowerCase(),
      password: String(formData.get('password') ?? ''),
      redirectTo: '/admin',
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
