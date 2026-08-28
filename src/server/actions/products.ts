'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { deleteCloudinaryImages } from '@/lib/cloudinary';
import { toMinor } from '@/lib/format';
import { productSchema, productStatusSchema, reportSchema } from '@/lib/validation';
import { assertOwnsProduct, requireAdmin, requireFarmerProfile, requireUser } from '@/server/authz';
import { track } from '@/server/analytics';

export type ActionState = { error?: string; fieldErrors?: Record<string, string[]> };

/** Zips the variantName/variantPrice/variantQuantity[] fields VariantEditor renders back into rows. */
function readVariants(formData: FormData) {
  const names = formData.getAll('variantName').map(String);
  const prices = formData.getAll('variantPrice').map(String);
  const quantities = formData.getAll('variantQuantity').map(String);
  return names
    .map((name, i) => ({ name: name.trim(), price: prices[i] ?? '', quantity: quantities[i]?.trim() || undefined }))
    .filter((v) => v.name && v.price.trim());
}

function readForm(formData: FormData) {
  const images = formData.getAll('images').map((v) => JSON.parse(String(v)));
  return {
    name: String(formData.get('name') ?? ''),
    categoryId: String(formData.get('categoryId') ?? ''),
    description: String(formData.get('description') ?? '') || undefined,
    price: formData.get('price'),
    unit: formData.get('unit'),
    quantity: formData.get('quantity'),
    // Always present, even empty — the form always renders the current photo
    // set, so an empty array is a real "no photos" state, not "unchanged".
    images,
    expectedHarvestDate: String(formData.get('expectedHarvestDate') ?? '') || undefined,
    variants: readVariants(formData),
    // Checkboxes only appear in FormData when checked.
    deliveryAvailable: formData.get('deliveryAvailable') === 'on',
    deliveryPaidBy: String(formData.get('deliveryPaidBy') ?? '') || undefined,
    negotiable: formData.get('negotiable') === 'on',
  };
}

function toHarvestDate(iso: string | undefined): Date | null {
  return iso ? new Date(`${iso}T00:00:00`) : null;
}

/** Payer only means anything when delivery is actually offered — clear it otherwise. */
function deliveryFields(d: { deliveryAvailable?: boolean; deliveryPaidBy?: 'FARMER' | 'BUYER' }) {
  const available = d.deliveryAvailable ?? false;
  return {
    deliveryAvailable: available,
    // Defaults to the buyer paying — matches the radio's own default in ProductForm.
    deliveryPaidBy: available ? (d.deliveryPaidBy ?? 'BUYER') : null,
  };
}

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { profile } = await requireFarmerProfile();
  const parsed = productSchema.safeParse(readForm(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  await prisma.product.create({
    data: {
      farmerId: profile.id,
      categoryId: d.categoryId,
      name: d.name,
      description: d.description,
      priceMinor: toMinor(d.price),
      unit: d.unit,
      quantity: d.quantity,
      initialQty: d.quantity,
      // Always the farmer's own farm location — never client-submitted, so a
      // listing can't claim to be somewhere the farm isn't.
      region: profile.region,
      town: profile.town,
      expectedHarvestDate: toHarvestDate(d.expectedHarvestDate),
      ...deliveryFields(d),
      negotiable: d.negotiable ?? false,
      // New listings queue for admin approval before they hit the marketplace.
      moderation: 'PENDING',
      images: d.images?.length
        ? { create: d.images.map((img, i) => ({ url: img.url, publicId: img.publicId, sortOrder: i })) }
        : undefined,
      variants: d.variants?.length
        ? { create: d.variants.map((v, i) => ({ name: v.name, priceMinor: toMinor(v.price), quantity: v.quantity, sortOrder: i })) }
        : undefined,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/listings');
  redirect('/dashboard/listings?posted=1');
}

/**
 * Admin posting on a farmer's behalf — for farmers who reach the platform by
 * phone call or USSD rather than the app itself. Location is still always
 * the farmer's own profile, same rule as createProduct, just looked up by
 * the farmerId the admin picked instead of the caller's own session. Goes
 * live immediately rather than queueing for approval — there's no one else
 * who needs to approve an admin's own submission.
 */
export async function adminCreateProduct(farmerId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const farmer = await prisma.farmerProfile.findUnique({ where: { id: farmerId }, select: { region: true, town: true } });
  if (!farmer) return { error: 'Farmer not found.' };

  const parsed = productSchema.safeParse(readForm(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  await prisma.product.create({
    data: {
      farmerId,
      categoryId: d.categoryId,
      name: d.name,
      description: d.description,
      priceMinor: toMinor(d.price),
      unit: d.unit,
      quantity: d.quantity,
      initialQty: d.quantity,
      region: farmer.region,
      town: farmer.town,
      expectedHarvestDate: toHarvestDate(d.expectedHarvestDate),
      ...deliveryFields(d),
      negotiable: d.negotiable ?? false,
      moderation: 'APPROVED',
      images: d.images?.length
        ? { create: d.images.map((img, i) => ({ url: img.url, publicId: img.publicId, sortOrder: i })) }
        : undefined,
      variants: d.variants?.length
        ? { create: d.variants.map((v, i) => ({ name: v.name, priceMinor: toMinor(v.price), quantity: v.quantity, sortOrder: i })) }
        : undefined,
    },
  });

  revalidatePath('/admin');
  revalidatePath('/');
  redirect(`/admin/listings/new?farmerId=${farmerId}&posted=1`);
}

export async function updateProduct(
  id: string,
  redirectTo: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const product = await assertOwnsProduct(id);
  const parsed = productSchema.safeParse(readForm(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const [before, farmer] = await Promise.all([
    prisma.product.findUniqueOrThrow({
      where: { id },
      select: { images: { select: { publicId: true } } },
    }),
    // Always the farmer's own farm location — never client-submitted, and
    // re-read fresh here since the farmer may have moved since this listing was posted.
    prisma.farmerProfile.findUniqueOrThrow({
      where: { id: product.farmerId },
      select: { region: true, town: true },
    }),
  ]);

  await prisma.product.update({
    where: { id },
    data: {
      categoryId: d.categoryId,
      name: d.name,
      description: d.description,
      priceMinor: toMinor(d.price),
      unit: d.unit,
      quantity: d.quantity,
      region: farmer.region,
      town: farmer.town,
      expectedHarvestDate: toHarvestDate(d.expectedHarvestDate),
      ...deliveryFields(d),
      negotiable: d.negotiable ?? false,
      // Full replace: the form always submits the complete desired photo set,
      // so dropping and recreating is simpler and correct than diffing.
      images: {
        deleteMany: {},
        create: (d.images ?? []).map((img, i) => ({ url: img.url, publicId: img.publicId, sortOrder: i })),
      },
      // Same full-replace approach for variants.
      variants: {
        deleteMany: {},
        create: (d.variants ?? []).map((v, i) => ({ name: v.name, priceMinor: toMinor(v.price), quantity: v.quantity, sortOrder: i })),
      },
    },
  });

  // Clean up whatever Cloudinary assets are no longer referenced — removed or
  // replaced photos, not ones the farmer kept.
  const kept = new Set((d.images ?? []).map((img) => img.publicId));
  const dropped = before.images.map((img) => img.publicId).filter((id) => !kept.has(id));
  await deleteCloudinaryImages(dropped);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/listings');
  revalidatePath('/admin');
  revalidatePath(`/products/${id}`);
  redirect(redirectTo);
}

/** Pause / unpause / mark sold. Farmers can never set REMOVED — that is admin-only. */
export async function setProductStatus(formData: FormData) {
  const parsed = productStatusSchema.safeParse({
    productId: formData.get('productId'),
    status: formData.get('status'),
  });
  if (!parsed.success) throw new Error('Invalid status');

  await assertOwnsProduct(parsed.data.productId);
  await prisma.product.update({
    where: { id: parsed.data.productId },
    data: { status: parsed.data.status },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/listings');
  revalidatePath('/admin');
  revalidatePath('/');
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get('productId') ?? '');
  const product = await assertOwnsProduct(id);
  const images = await prisma.productImage.findMany({ where: { productId: id }, select: { publicId: true } });

  // ProductImage rows cascade-delete with the product; the Cloudinary
  // assets they pointed at do not, so clean those up too.
  await prisma.product.delete({ where: { id } });
  await deleteCloudinaryImages(images.map((i) => i.publicId));

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/listings');
  revalidatePath('/');
  revalidatePath(`/farmers/${product.farmerId}`);
}

export async function toggleFavorite(formData: FormData) {
  const user = await requireUser();
  const productId = String(formData.get('productId') ?? '');

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, productId } });
    void track({ type: 'LISTING_SAVED', userId: user.id, entityId: productId });
  }

  revalidatePath(`/products/${productId}`);
}

export async function reportProduct(formData: FormData) {
  const user = await requireUser();
  const parsed = reportSchema.safeParse({
    productId: formData.get('productId'),
    reason: formData.get('reason'),
    details: formData.get('details') || undefined,
  });
  if (!parsed.success) throw new Error('Tell us what is wrong with the listing');

  await prisma.report.create({ data: { ...parsed.data, reporterId: user.id } });
  revalidatePath('/admin');
}
