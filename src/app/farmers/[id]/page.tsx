import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ContactPrompt } from '@/components/contact-prompt';
import { LifecycleBadge } from '@/components/badges';
import { FollowButton } from '@/components/follow-button';
import {
  CalendarIcon,
  ChatIcon,
  ClockIcon,
  HeartIcon,
  PackageIcon,
  PhoneIcon,
  SproutIcon,
  StarIcon,
  StoreIcon,
  UserIcon,
  UsersIcon,
} from '@/components/icons';
import { ProductCard } from '@/components/product-card';
import { ProfileHero } from '@/components/profile-hero';
import { SectionCard } from '@/components/section-card';
import { ShareFarmButton } from '@/components/share-farm-button';
import { StatCard } from '@/components/stat-card';
import { TrustScoreBadge } from '@/components/trust-score-badge';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { getProductLifecycle, lastActiveLabel, timeAgo, whatsappProductLink, type ProductLifecycle } from '@/lib/format';
import { computeTrustScore } from '@/lib/trust';
import { prisma } from '@/lib/prisma';
import { getFarmActivity, getFarmer, getFollowerCount, isFollowingFarmer, type FarmActivityKind } from '@/server/queries';
import { currentUser } from '@/server/authz';
import { track } from '@/server/analytics';

const ACTIVITY_ICON: Record<FarmActivityKind, React.ReactNode> = {
  harvest: <SproutIcon className="h-4 w-4" />,
  product: <PackageIcon className="h-4 w-4" />,
  verified: <StarIcon className="h-4 w-4" filled />,
  followers: <UsersIcon className="h-4 w-4" />,
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const farmer = await getFarmer(params.id);
  if (!farmer) return {};

  const title = `${farmer.farmName} — ${farmer.region}`;
  const description = `${farmer.farmName} in ${farmer.town}, ${farmer.region}. ${
    farmer.verification === 'VERIFIED' ? 'Verified farmer on' : 'Farmer on'
  } Farmers Market.${farmer.description ? ` ${farmer.description}` : ''}`.slice(0, 160);
  // Only the farmer's own uploaded cover photo — no fabricated stand-in when there isn't one.
  const image = farmer.coverImage;

  return {
    title,
    description,
    openGraph: { title, description, images: image ? [{ url: image }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  };
}

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
  void track({ type: 'FARMER_VIEWED', userId: user?.id, entityId: farmer.id });

  const [savedByBuyers, followerCount, isFollowing, activity] = await Promise.all([
    prisma.favorite.count({ where: { product: { farmerId: farmer.id } } }),
    getFollowerCount(farmer.user.id),
    user?.role === 'BUYER' ? isFollowingFarmer(user.id, farmer.user.id) : false,
    getFarmActivity(farmer, farmer.user.id),
  ]);

  const memberSince = farmer.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const trustScore = computeTrustScore({
    verification: farmer.verification,
    lastActiveAt: farmer.user.lastActiveAt,
    activeListings: farmer.products.length,
    followers: followerCount,
    memberSince: farmer.createdAt,
  });

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
      <Breadcrumbs items={[{ label: 'Marketplace', href: '/' }, { label: 'Farmers' }, { label: farmer.farmName }]} />

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
        summary={<TrustScoreBadge score={trustScore} />}
        actions={
          <>
            {!user ? (
              <ContactPrompt message="Sign in to follow or contact this farmer." />
            ) : (
              <>
                {user.role === 'BUYER' && (
                  <FollowButton
                    farmerUserId={farmer.user.id}
                    storefrontPath={`/farmers/${farmer.id}`}
                    initialFollowing={isFollowing}
                    className="sm:flex-1"
                  />
                )}
                {farmer.products[0] && (
                  <WhatsAppButton
                    href={whatsappProductLink(farmer.whatsapp, farmer.products[0].name)}
                    label="Message on WhatsApp"
                    className="sm:flex-1"
                    trackEntityId={farmer.id}
                  />
                )}
              </>
            )}
            {/* Public action, visible to everyone including guests — sharing a storefront exposes nothing that isn't already public. */}
            <ShareFarmButton
              farmName={farmer.farmName}
              region={farmer.region}
              trustScore={trustScore}
              coverImage={farmer.coverImage}
              className="sm:flex-1"
            />
          </>
        }
      />

      <div className="mb-5">
        <SectionCard title="Farm Reputation">
          <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              compact
              icon={<UserIcon />}
              label="Followers"
              value={followerCount}
              emptyIcon={<UsersIcon className="h-5 w-5" />}
              emptyMessage="Share your farm to attract your first follower."
              emptyHref="#share-farm"
              emptyLinkLabel="Share Farm"
            />
            <StatCard compact icon={<HeartIcon className="h-[18px] w-[18px]" />} label="Saved by buyers" value={savedByBuyers} />
            <StatCard compact icon={<StoreIcon />} label="Active listings" value={farmer.products.length} />
            <StatCard compact icon={<ClockIcon />} label="Last active" value={lastActiveLabel(farmer.user.lastActiveAt)} />
            <StatCard compact icon={<CalendarIcon />} label="Member since" value={memberSince} />
          </div>
        </SectionCard>
      </div>

      <div className="mb-5">
        <SectionCard title="About the Farm">
          <div className="p-4">
            <p className="text-[15px] text-muted">
              {farmer.description || 'Tell buyers about your farm.'}
            </p>
            <dl className="mt-3 grid grid-cols-1 gap-3 border-t border-line pt-3 sm:grid-cols-3 sm:divide-x sm:divide-line">
              <div className="sm:pr-3">
                <dt className="eyebrow">Farm name</dt>
                <dd className="mt-1 truncate text-sm font-bold">{farmer.farmName}</dd>
              </div>
              <div className="sm:px-3">
                <dt className="eyebrow">Region</dt>
                <dd className="mt-1 truncate text-sm font-bold">{farmer.town}, {farmer.region}</dd>
              </div>
              <div className="sm:pl-3">
                <dt className="eyebrow">Contact</dt>
                <dd className="mt-1 flex items-center gap-1.5">
                  <span className="badge bg-leaf-light text-leaf-dark">
                    <ChatIcon className="h-3 w-3" /> WhatsApp
                  </span>
                  <span className="badge bg-paper text-muted">
                    <PhoneIcon className="h-3 w-3" /> Phone
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </SectionCard>
      </div>

      {activity.length > 0 && (
        <div className="mb-5">
          <SectionCard title="Recent Farm Activity">
            <div className="divide-y divide-line">
              {activity.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5">
                  <span className="text-muted" aria-hidden>{ACTIVITY_ICON[item.icon]}</span>
                  <span className="flex-1 truncate text-[13.5px] font-semibold">{item.message}</span>
                  <span className="shrink-0 text-[12px] text-muted">{timeAgo(item.at)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

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
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              {groups.get(lifecycle)!.map((p) => <ProductCard key={p.id} p={p} size="sm" />)}
            </div>
          </div>
        ))
      )}
    </>
  );
}
