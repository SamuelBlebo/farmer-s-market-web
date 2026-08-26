import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { requireUser } from '@/server/authz';
import { getFavorites } from '@/server/queries';

export default async function FavoritesPage() {
  const user = await requireUser();
  const products = await getFavorites(user.id);

  return (
    <>
      <p className="eyebrow">Saved</p>
      <h1 className="mb-4 mt-1 text-2xl font-bold tracking-tight">Your saved items</h1>

      {products.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-bold">Nothing saved yet.</p>
          <p className="mt-1 text-sm text-muted">Tap ♡ Save on any listing to keep track of it here.</p>
          <Link href="/" className="btn mt-4">Browse produce</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </>
  );
}
