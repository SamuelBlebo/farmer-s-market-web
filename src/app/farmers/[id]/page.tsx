import { notFound } from 'next/navigation';
import { VerifiedBadge } from '@/components/badges';
import { ContactPrompt } from '@/components/contact-prompt';
import { ProductCard } from '@/components/product-card';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { lastActiveLabel, whatsappProductLink } from '@/lib/format';
import { getFarmer } from '@/server/queries';
import { currentUser } from '@/server/authz';

export default async function FarmerPage({ params }: { params: { id: string } }) {
  const [farmer, user] = await Promise.all([getFarmer(params.id), currentUser()]);
  if (!farmer) notFound();

  return (
    <>
      <section className="card mb-5 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-leaf-light text-xl font-extrabold text-leaf-dark">
            {farmer.farmName[0]}
          </div>
          <div className="min-w-[200px] flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight">{farmer.farmName}</h1>
            <p className="text-muted">📍 {farmer.town}, {farmer.region}</p>
            <p className="text-[12.5px] text-muted">
              Member since {farmer.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              {' · '}{farmer.products.length} active listing{farmer.products.length === 1 ? '' : 's'}
              {' · '}{lastActiveLabel(farmer.user.lastActiveAt)}
            </p>
          </div>
          <VerifiedBadge status={farmer.verification} large />
        </div>

        <p className="mt-3.5 text-[15px] text-muted">{farmer.description}</p>

        {farmer.products[0] && (
          user ? (
            <WhatsAppButton
              href={whatsappProductLink(farmer.whatsapp, farmer.products[0].name)}
              label="Message on WhatsApp"
              className="mt-3.5"
            />
          ) : (
            <ContactPrompt message="Sign in to contact this farmer." className="mt-3.5" />
          )
        )}
      </section>

      <h2 className="mb-3 text-lg font-extrabold tracking-tight">
        {farmer.products.length} active listing{farmer.products.length === 1 ? '' : 's'}
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {farmer.products.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </>
  );
}
