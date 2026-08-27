import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe slice of the auth config (no Prisma, no bcrypt) so middleware can run
 * on the edge runtime. The full config in auth.ts spreads this.
 */
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  // Redirects follow the incoming request's Host header instead of a fixed
  // AUTH_URL — otherwise signing in from another device on the LAN (e.g. a
  // phone hitting the dev machine's IP) redirects back to that device's own
  // "localhost", which isn't the dev server. Safe here: this app is never
  // deployed behind a reverse proxy where an untrusted Host header could be
  // spoofed to redirect users off-site.
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const role = auth?.user?.role;
      const { pathname } = request.nextUrl;

      // The admin login page itself must stay reachable, and unauthorized
      // access to the rest of /admin goes to it — not the farmer/buyer login.
      if (pathname === '/admin/login') return true;
      if (pathname.startsWith('/admin')) {
        if (role === 'ADMIN') return true;
        return Response.redirect(new URL('/admin/login', request.nextUrl));
      }
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
