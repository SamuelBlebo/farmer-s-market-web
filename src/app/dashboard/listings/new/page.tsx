import { ListingModeTabs } from '@/components/listing-mode-tabs';
import { ProductForm } from '@/components/product-form';
import { QuickPostForm } from '@/components/quick-post-form';
import { UNITS } from '@/lib/constants';
import { requireFarmerProfile } from '@/server/authz';
import { getCategories } from '@/server/queries';
import { createProduct } from '@/server/actions/products';

export default async function NewListingPage() {
  const { profile } = await requireFarmerProfile();
  const categories = await getCategories();
  const defaultCategory = categories.find((c) => c.slug === 'other') ?? categories[0];

  return (
    <div className="mx-auto max-w-[640px]">
      <p className="eyebrow">Takes about a minute</p>
      <h1 className="mb-4 mt-1 text-2xl font-bold tracking-tight">Post produce</h1>
      <ListingModeTabs
        quick={
          <QuickPostForm
            categoryId={defaultCategory.id}
            categoryName={defaultCategory.name}
            unit={UNITS[0]}
            region={profile.region}
            town={profile.town}
          />
        }
        full={
          <ProductForm
            action={createProduct}
            categories={categories}
            initial={{ region: profile.region, town: profile.town }}
            submitLabel="Post listing"
          />
        }
      />
      <p className="mt-3 text-center text-[12.5px] text-muted">
        An admin reviews new listings, usually the same day. You can edit or pause it any time.
      </p>
    </div>
  );
}
