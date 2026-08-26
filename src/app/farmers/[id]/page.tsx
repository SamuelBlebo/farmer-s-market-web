import { notFound } from 'next/navigation';
import { ContactPrompt } from '@/components/contact-prompt';
import { LifecycleBadge } from '@/components/badges';
import { CalendarIcon, DocumentIcon, HeartIcon, PinIcon, StoreIcon } from '@/components/icons';
import { ProductCard } from '@/components/product-card';
import { ProfileHero } from '@/components/profile-hero';
import { SectionCard, SectionRow } from '@/components/section-card';
import { StatCard } from '@/components/stat-card';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { getProductLifecycle, lastActiveLabel, whatsappProductLink, type ProductLifecycle } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { getFarmer } from '@/server/queries';
import { currentUser } from '@/server/authz';

const GROUP_ORDER: Extract<ProductLifecycle, 'AVAILABLE_NOW' | 'UPCOMING_HARVEST' | 'ONGOING'>[] = [
  'AVAILABLE_NOW',
  'UPCOMING_HARVEST',
  'ONGOING',
];
const GROUP_TITLE: Record<(typeof GROUP_ORDER)[number], string> = {
  AVAILABLE_NOW: 'Available Now',
  UPCOMING_HARVEST: 'Upcoming Harvest',
  ONGOING: 'Ongoing Crops',
};

export default async function FarmerPage({ params }: { params: { id: string } }) {
  const [farmer, user] = await Promise.all([getFarmer(params.id), currentUser()]);
  if (!farmer) notFound();

  const [savedByBuyers, upcomingHarvests] = await Promise.all([
    prisma.favorite.count({ where: { product: { farmerId: farmer.id } } }),
    prisma.product.count({ where: { farmerId: farmer.id, status: 'ACTIVE', expectedHarvestDate: { gt: new Date() } } }),
  ]);

  const memberSince = farmer.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  // farmer.products is already ACTIVE + APPROVED only (see getFarmer), so this
  // never needs a SOLD_OUT/PAUSED bucket — reuses the same lifecycle logic as
  // the marketplace and farmer dashboard, no new query.
  const groups = new Map<(typeof GROUP_ORDER)[number], typeof farmer.products>();
  for (const p of farmer.products) {
    const lifecycle = getProductLifecycle(p.status, p.expectedHarvestDate) as (typeof GROUP_ORDER)[number];
    groups.set(lifecycle, [...(groups.get(lifecycle) ?? []), p]);
  }

  return (
    <>
      <ProfileHero
        coverImage={farmer.coverImage}
        avatarUrl={farmer.user.image}
        avatarLetter={farmer.farmName[0]}
        name={farmer.farmName}
        roleLabel="Farmer"
        verification={farmer.verification}
        region={farmer.region}
        memberSince={memberSince}
        lastActive={lastActiveLabel(farmer.user.lastActiveAt)}
        actions={
          farmer.products[0] ? (
            user ? (
              <WhatsAppButton
                href={whatsappProductLink(farmer.whatsapp, farmer.products[0].name)}
                label="Message on WhatsApp"
                className="sm:flex-1"
              />
            ) : (
              <ContactPrompt message="Sign in to contact this farmer." />
            )
          ) : undefined
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<StoreIcon />} label="Active listings" value={farmer.products.length} />
        <StatCard icon={<HeartIcon className="h-[18px] w-[18px]" />} label="Saved by buyers" value={savedByBuyers} />
        <StatCard icon={<CalendarIcon />} label="Upcoming harvests" value={upcomingHarvests} />
        <StatCard icon={<CalendarIcon />} label="Member since" value={memberSince} />
      </div>

      <div className="mb-5">
        <SectionCard title="About the Farm">
          <div className="p-4">
            <p className="text-[15px] text-muted">
              {farmer.description || 'Tell buyers about your farm.'}
            </p>
            <dl className="mt-3 divide-y divide-line border-t border-line">
              <SectionRow label="Farm name" value={farmer.farmName} />
              <SectionRow label="Region" value={`${farmer.town}, ${farmer.region}`} />
              <SectionRow
                label="Contact"
                value={
                  <span className="inline-flex items-center gap-2">
                    <span className="badge bg-leaf-light text-leaf-dark">💬 WhatsApp</span>
                    <span className="badge bg-paper text-muted">📞 Phone</span>
                  </span>
                }
              />
            </dl>
          </div>
        </SectionCard>
      </div>

      {farmer.products.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-bold">No active listings right now.</p>
          <p className="mt-1 text-sm text-muted">Check back soon.</p>
        </div>
      ) : (
        GROUP_ORDER.filter((lifecycle) => groups.has(lifecycle)).map((lifecycle) => (
          <div key={lifecycle} className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{GROUP_TITLE[lifecycle]}</h2>
              <LifecycleBadge lifecycle={lifecycle} />
              <span className="text-[12.5px] text-muted">{groups.get(lifecycle)!.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {groups.get(lifecycle)!.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        ))
      )}
    </>
  );
}
