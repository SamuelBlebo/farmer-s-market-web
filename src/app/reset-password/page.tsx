import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth-forms';

export const metadata: Metadata = { title: 'Set a new password' };

export default function ResetPasswordPage({ searchParams }: { searchParams: { email?: string; token?: string } }) {
  const email = searchParams.email ?? '';
  const token = searchParams.token ?? '';

  return (
    <div className="mx-auto max-w-[420px]">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-muted">Choose a new password for {email || 'your account'}.</p>
      </div>
      {email && token ? (
        <ResetPasswordForm email={email} token={token} />
      ) : (
        <div className="card p-5 text-center">
          <p className="font-bold">This link is missing information.</p>
          <p className="mt-1 text-sm text-muted">Request a new reset link and use it directly from the email.</p>
        </div>
      )}
      <p className="mt-3 text-center text-sm text-muted">
        <Link href="/forgot-password" className="font-bold text-leaf">Request a new link</Link>
      </p>
    </div>
  );
}
