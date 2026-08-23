import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe slice of the auth config (no Prisma, no bcrypt) so middleware can run
 * on the edge runtime. The full config in auth.ts spreads this.
 */
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const role = auth?.user?.role;
      const { pathname } = request.nextUrl;

      if (pathname.startsWith('/admin')) return role === 'ADMIN';
      if (pathname.startsWith('/dashboard')) return role === 'FARMER' || role === 'ADMIN';
      if (pathname.startsWith('/wanted/new')) return role === 'BUYER' || role === 'ADMIN';
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
