import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// First gate only. Every server action and route handler re-checks the session
// and ownership — middleware is never the sole authorization.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/wanted/new'],
};
