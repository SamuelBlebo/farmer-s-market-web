import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/product-form';
import { prisma } from '@/lib/prisma';
import { assertOwnsProduct } from '@/server/authz';
import { getCategories } from '@/server/queries';
import { updateProduct } from '@/server/actions/products';

export default async function EditListingPage({ params }: { params: { id: string } }) {
  // Throws if the signed-in farmer does not own this listing.
  await assertOwnsProduct(params.id);

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    }),
    getCategories(),
  ]);
  if (!product) notFound();

  const action = updateProduct.bind(null, product.id);

  return (
    <div className="mx-auto max-w-[640px]">
      <p className="eyebrow">Editing</p>
      <h1 className="mb-4 mt-1 text-2xl font-extrabold tracking-tight">{product.name}</h1>
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
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
