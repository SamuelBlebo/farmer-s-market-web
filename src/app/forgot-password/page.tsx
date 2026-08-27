import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth-forms';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-[420px]">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="text-muted">Enter the email on your account and we&apos;ll send a reset link.</p>
      </div>
      <ForgotPasswordForm />
      <p className="mt-3 text-center text-sm text-muted">
        <Link href="/login" className="font-bold text-leaf">Back to sign in</Link>
      </p>
    </div>
  );
}
