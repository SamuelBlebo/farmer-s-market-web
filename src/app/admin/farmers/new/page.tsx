import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminCreateFarmerForm } from '@/components/admin-create-farmer-form';
import { requireAdmin } from '@/server/authz';

export const metadata: Metadata = { title: 'Add a Farmer' };

export default async function AdminNewFarmerPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-[560px]">
      <Link href="/admin" className="btn-ghost mb-4">← Back to admin</Link>
      <p className="eyebrow">Admin</p>
      <h1 className="mb-1 mt-1 text-2xl font-bold tracking-tight">Add a farmer</h1>
      <p className="mb-4 text-[15px] text-muted">
        For farmers who reach you by phone call or USSD instead of signing up themselves — set their account up
        here, then post their listings for them.
      </p>
      <AdminCreateFarmerForm />
    </div>
  );
}
