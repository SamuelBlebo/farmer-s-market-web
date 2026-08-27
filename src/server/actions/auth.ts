'use server';

import { randomBytes } from 'crypto';
import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { signIn, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { normalizeGhanaPhone } from '@/lib/format';
import { PLATFORM_NAME, SITE_URL } from '@/lib/constants';
import { clientIp, isRateLimited } from '@/lib/rate-limit';
import { forgotPasswordSchema, registerSchema, resetPasswordSchema, phoneLoginSchema } from '@/lib/validation';

export type AuthState = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean };

const RESET_TOKEN_TTL_MS = 60 * 60_000;
const RESET_REQUEST_LIMIT = 3;
const RESET_REQUEST_WINDOW_MS = 15 * 60_000;

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

/**
 * Only works for accounts with an email on file — email is optional at
 * registration, so phone-only accounts can't self-serve this way (see
 * /forgot-password, which points them to /support instead). Always returns
 * the same success response regardless of whether the email matched, so
 * this can't be used to enumerate registered addresses.
 */
export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (isRateLimited(`reset:${clientIp(headers())}`, RESET_REQUEST_LIMIT, RESET_REQUEST_WINDOW_MS)) {
    // Same generic response as a successful request — this endpoint never confirms or denies anything either way.
    return { success: true };
  }

  const parsed = forgotPasswordSchema.safeParse({ email: String(formData.get('email') ?? '').toLowerCase() });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user?.email) {
    const token = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: { identifier: user.email, token, expires: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });
    const resetUrl = `${SITE_URL}/reset-password?email=${encodeURIComponent(user.email)}&token=${token}`;
    await sendEmail({
      to: user.email,
      subject: `Reset your ${PLATFORM_NAME} password`,
      text: `Hi ${user.name},\n\nReset your password: ${resetUrl}\n\nThis link expires in an hour. If you didn't request this, ignore it.`,
    });
  }

  return { success: true };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse({
    email: String(formData.get('email') ?? '').toLowerCase(),
    token: String(formData.get('token') ?? ''),
    newPassword: String(formData.get('newPassword') ?? ''),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { email, token, newPassword } = parsed.data;
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.identifier !== email || record.expires < new Date()) {
    return { error: 'This reset link is invalid or has expired. Request a new one.' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: 'This reset link is invalid or has expired. Request a new one.' };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    // Single-use — burn the token now that it's done its job.
    prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } }),
  ]);

  redirect('/login?reset=1');
}
