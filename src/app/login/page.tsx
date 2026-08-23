import Link from 'next/link';
import { LoginForm } from '@/components/auth-forms';

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-[420px]">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="text-muted">Sign in to post produce or contact farmers.</p>
      </div>
      <LoginForm />
      <p className="mt-3 text-center text-sm text-muted">
        New here? <Link href="/register" className="font-bold text-leaf">Create an account</Link>
      </p>
    </div>
  );
}
