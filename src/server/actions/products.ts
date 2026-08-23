'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { toMinor } from '@/lib/format';
import { productSchema, productStatusSchema, reportSchema } from '@/lib/validation';
import { assertOwnsProduct, requireFarmerProfile, requireUser } from '@/server/authz';

export type ActionState = { error?: string; fieldErrors?: Record<string, string[]> };

function readForm(formData: FormData) {
  const images = formData.getAll('images').map((v) => JSON.parse(String(v)));
  return {
    name: String(formData.get('name') ?? ''),
    categoryId: String(formData.get('categoryId') ?? ''),
    description: String(formData.get('description') ?? '') || undefined,
    price: formData.get('price'),
    unit: formData.get('unit'),
    quantity: formData.get('quantity'),
    region: formData.get('region'),
    town: String(formData.get('town') ?? ''),
    ...(images.length ? { images } : {}),
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
      region: d.region,
      town: d.town,
      // New listings queue for admin approval before they hit the marketplace.
      moderation: 'PENDING',
      images: d.images?.length
        ? { create: d.images.map((img, i) => ({ url: img.url, publicId: img.publicId, sortOrder: i })) }
        : undefined,
    },
  });

  revalidatePath('/dashboard');
  redirect('/dashboard?posted=1');
}

export async function updateProduct(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await assertOwnsProduct(id);
  const parsed = productSchema.safeParse(readForm(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  await prisma.product.update({
    where: { id },
    data: {
      categoryId: d.categoryId,
      name: d.name,
      description: d.description,
      priceMinor: toMinor(d.price),
      unit: d.unit,
      quantity: d.quantity,
      region: d.region,
      town: d.town,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath(`/products/${id}`);
  redirect('/dashboard?saved=1');
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
  revalidatePath('/');
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get('productId') ?? '');
  await assertOwnsProduct(id);
  await prisma.product.delete({ where: { id } });
  revalidatePath('/dashboard');
}

export async function toggleFavorite(formData: FormData) {
  const user = await requireUser();
  const productId = String(formData.get('productId') ?? '');

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) await prisma.favorite.delete({ where: { id: existing.id } });
  else await prisma.favorite.create({ data: { userId: user.id, productId } });

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
