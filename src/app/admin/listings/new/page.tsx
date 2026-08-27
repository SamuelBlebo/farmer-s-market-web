import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminFarmerPicker } from '@/components/admin-farmer-picker';
import { ProductForm } from '@/components/product-form';
import { ToastListener } from '@/components/toast-listener';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/authz';
import { getCategories } from '@/server/queries';
import { adminCreateProduct } from '@/server/actions/products';

export const metadata: Metadata = { title: 'Post a Listing for a Farmer' };

export default async function AdminNewListingPage({ searchParams }: { searchParams: { farmerId?: string } }) {
  await requireAdmin();

  const [categories, farmers] = await Promise.all([
    getCategories(),
    prisma.farmerProfile.findMany({
      select: { id: true, farmName: true, town: true, region: true, phone: true },
      orderBy: { farmName: 'asc' },
    }),
  ]);
  const selectedFarmer = farmers.find((f) => f.id === searchParams.farmerId);

  return (
    <div className="mx-auto max-w-[640px]">
      <Link href="/admin" className="btn-ghost mb-4">← Back to admin</Link>
      <p className="eyebrow">Admin</p>
      <h1 className="mb-1 mt-1 text-2xl font-bold tracking-tight">Post a listing for a farmer</h1>
      <p className="mb-4 text-[15px] text-muted">
        Goes live immediately — no separate approval step, since you&apos;re posting it directly.
      </p>

      <Suspense>
        <ToastListener messages={{ posted: 'Listing posted and live.' }} />
      </Suspense>

      <AdminFarmerPicker farmers={farmers} selectedId={searchParams.farmerId} />

      {selectedFarmer ? (
        <ProductForm
          action={adminCreateProduct.bind(null, selectedFarmer.id)}
          categories={categories}
          initial={{ region: selectedFarmer.region, town: selectedFarmer.town }}
          submitLabel={`Post listing for ${selectedFarmer.farmName}`}
          locationNote={`Posts from ${selectedFarmer.farmName}'s registered location — update it from the Farmer verification list on /admin if it's changed.`}
        />
      ) : (
        <div className="card p-8 text-center text-sm text-muted">Select a farmer above to continue.</div>
      )}

      <p className="mt-4 text-center text-[13px] text-muted">
        Farmer not registered yet?{' '}
        <Link href="/admin/farmers/new" className="font-semibold text-leaf-dark hover:underline">Add them first</Link>.
      </p>
    </div>
  );
}
