import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/auth-forms';
import { LockIcon } from '@/components/icons';
import { currentUser } from '@/server/authz';

export default async function AdminLoginPage() {
  const user = await currentUser();
  if (user?.role === 'ADMIN') redirect('/admin');

  return (
    <div className="mx-auto max-w-[380px]">
      <div className="mb-5 text-center">
        <p className="eyebrow inline-flex items-center justify-center gap-1"><LockIcon className="h-3 w-3" /> Restricted access</p>
        <h1 className="text-2xl font-bold tracking-tight">Administrator Login</h1>
        <p className="text-muted">Platform administration only. Farmer and buyer accounts cannot sign in here.</p>
      </div>
      <AdminLoginForm />
    </div>
  );
}
