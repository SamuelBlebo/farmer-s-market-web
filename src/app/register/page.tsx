import Link from 'next/link';
import { RegisterForm } from '@/components/auth-forms';

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-[440px]">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Join Farmers Market</h1>
        <p className="text-muted">Sell your produce. Find what you need.</p>
      </div>
      <RegisterForm />
      <p className="mt-3 text-center text-sm text-muted">
        Already have an account? <Link href="/login" className="font-bold text-leaf">Sign in</Link>
      </p>
    </div>
  );
}
