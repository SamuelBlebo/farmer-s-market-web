import { ProductForm } from '@/components/product-form';
import { requireFarmerProfile } from '@/server/authz';
import { getCategories } from '@/server/queries';
import { createProduct } from '@/server/actions/products';

export default async function NewListingPage() {
  const { profile } = await requireFarmerProfile();
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-[640px]">
      <p className="eyebrow">Takes about a minute</p>
      <h1 className="mb-4 mt-1 text-2xl font-extrabold tracking-tight">Post produce</h1>
      <ProductForm
        action={createProduct}
        categories={categories}
        initial={{ region: profile.region, town: profile.town }}
        submitLabel="Post listing"
      />
      <p className="mt-3 text-center text-[12.5px] text-muted">
        An admin reviews new listings, usually the same day. You can edit or pause it any time.
      </p>
    </div>
  );
}
