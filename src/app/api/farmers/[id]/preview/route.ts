import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeTrustScore } from '@/lib/trust';
import { currentUser } from '@/server/authz';
import { getFollowerCount, isFollowingFarmer } from '@/server/queries';

/**
 * Backs the product card's hover/long-press farmer preview. Deliberately
 * lazy (fetched only when a card is actually hovered) rather than joined
 * into every card's initial query — a grid can hold 24+ cards and most
 * farmers on it are never previewed.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const farmer = await prisma.farmerProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, image: true, lastActiveAt: true } },
      _count: { select: { products: { where: { status: 'ACTIVE', moderation: 'APPROVED' } } } },
    },
  });
  if (!farmer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [user, followers] = await Promise.all([currentUser(), getFollowerCount(farmer.user.id)]);
  const trustScore = computeTrustScore({
    verification: farmer.verification,
    lastActiveAt: farmer.user.lastActiveAt,
    activeListings: farmer._count.products,
    followers,
    memberSince: farmer.createdAt,
  });
  const isFollowing = user?.role === 'BUYER' ? await isFollowingFarmer(user.id, farmer.user.id) : false;

  return NextResponse.json({
    farmerId: farmer.id,
    farmerUserId: farmer.user.id,
    farmName: farmer.farmName,
    avatarUrl: farmer.user.image,
    region: farmer.region,
    verification: farmer.verification,
    activeListings: farmer._count.products,
    trustScore,
    isFollowing,
    canFollow: user?.role === 'BUYER',
    signedIn: Boolean(user),
  });
}
