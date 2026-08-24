import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { normalizeGhanaPhone } from '@/lib/format';
import { loginSchema, phoneLoginSchema } from '@/lib/validation';
import type { User } from '@prisma/client';

/** Shared by both providers: check the password, shape the session user. */
async function verify(user: User | null, password: string) {
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Email',
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
        return verify(user, parsed.data.password);
      },
    }),
    Credentials({
      id: 'phone-credentials',
      name: 'Phone',
      credentials: { phone: {}, password: {} },
      async authorize(raw) {
        const parsed = phoneLoginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { phone: normalizeGhanaPhone(parsed.data.phone) } });
        // Phone sign-in is for farmers and buyers only — never admin.
        if (user?.role === 'ADMIN') return null;
        return verify(user, parsed.data.password);
      },
    }),
  ],
});
