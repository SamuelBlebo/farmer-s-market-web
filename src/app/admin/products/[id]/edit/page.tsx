import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ModerationBadge, StatusBadge } from '@/components/badges';
import { StarIcon } from '@/components/icons';
import { ProductForm } from '@/components/product-form';
import { SubmitButton } from '@/components/submit-button';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/authz';
import { getCategories } from '@/server/queries';
import { setProductStatus, updateProduct } from '@/server/actions/products';
import { moderateProduct, removeProduct, toggleFeatured } from '@/server/actions/admin';

export default async function AdminEditProductPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { sortOrder: 'asc' } },
        farmer: { select: { farmName: true } },
      },
    }),
    getCategories(),
  ]);
  if (!product) notFound();

  const action = updateProduct.bind(null, product.id, '/admin?saved=1');

  return (
    <div className="mx-auto max-w-[640px]">
      <Link href="/admin" className="btn-ghost mb-4">← Back to admin</Link>

      <p className="eyebrow">Admin edit · {product.farmer.farmName}</p>
      <div className="mb-4 mt-1 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
        <StatusBadge status={product.status} />
        <ModerationBadge status={product.moderation} />
        {product.featured && (
          <span className="badge bg-gold-light text-[#8A6100]">
            <StarIcon className="h-3 w-3" filled /> Featured
          </span>
        )}
      </div>

      <div className="card mb-4 p-4">
        <p className="eyebrow mb-2">Status &amp; moderation</p>
        <div className="flex flex-wrap gap-2">
          {product.moderation !== 'APPROVED' && (
            <form action={moderateProduct}>
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="decision" value="APPROVED" />
              <SubmitButton pendingLabel="Approving…" className="btn !px-3 !py-1.5 !text-[13px]">Approve</SubmitButton>
            </form>
          )}
          {product.moderation !== 'REJECTED' && (
            <form action={moderateProduct}>
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="decision" value="REJECTED" />
              <SubmitButton pendingLabel="Rejecting…" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Reject</SubmitButton>
            </form>
          )}
          {product.status !== 'ACTIVE' && product.status !== 'REMOVED' && (
            <form action={setProductStatus}>
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="status" value="ACTIVE" />
              <SubmitButton pendingLabel="Saving…" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Set active</SubmitButton>
            </form>
          )}
          {product.status === 'ACTIVE' && (
            <form action={setProductStatus}>
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="status" value="PAUSED" />
              <SubmitButton pendingLabel="Saving…" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Pause</SubmitButton>
            </form>
          )}
          {product.status !== 'SOLD' && product.status !== 'REMOVED' && (
            <form action={setProductStatus}>
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="status" value="SOLD" />
              <SubmitButton pendingLabel="Saving…" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Mark sold</SubmitButton>
            </form>
          )}
          {product.status !== 'REMOVED' && (
            <form action={removeProduct}>
              <input type="hidden" name="productId" value={product.id} />
              <SubmitButton pendingLabel="Removing…" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Remove listing</SubmitButton>
            </form>
          )}
          <form action={toggleFeatured}>
            <input type="hidden" name="productId" value={product.id} />
            <SubmitButton pendingLabel="Saving…" className="btn-ghost inline-flex items-center gap-1.5 !px-3 !py-1.5 !text-[13px]">
              <StarIcon className="h-3.5 w-3.5" filled={product.featured} />
              {product.featured ? 'Unfeature' : 'Feature this listing'}
            </SubmitButton>
          </form>
        </div>
      </div>

      <ProductForm
        action={action}
        categories={categories}
        initial={{
          name: product.name,
          categoryId: product.categoryId,
          price: product.priceMinor / 100,
          unit: product.unit,
          quantity: String(product.quantity),
          region: product.region,
          town: product.town,
          description: product.description,
          images: product.images.map((i) => ({ url: i.url, publicId: i.publicId })),
          expectedHarvestDate: product.expectedHarvestDate ? product.expectedHarvestDate.toISOString().slice(0, 10) : undefined,
          variants: product.variants.map((v) => ({ name: v.name, price: v.priceMinor / 100, quantity: v.quantity ? Number(v.quantity) : null })),
          deliveryAvailable: product.deliveryAvailable,
          deliveryPaidBy: product.deliveryPaidBy,
          negotiable: product.negotiable,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
