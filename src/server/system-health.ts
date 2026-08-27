import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/prisma';
import pkg from '../../package.json';

export type ServiceStatus = { ok: boolean; label: string; detail: string; latencyMs?: number };

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'AUTH_URL',
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'NEXT_PUBLIC_PLATFORM_NAME',
  'NEXT_PUBLIC_SITE_URL',
] as const;

/** Real connectivity check, not just "is the env var set" — runs a trivial query and times it. */
async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, label: 'Connected', detail: 'Query round-trip succeeded.', latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, label: 'Unreachable', detail: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/** Pings Cloudinary's admin API — confirms the credentials actually work, not just that they're set. */
async function checkCloudinary(): Promise<ServiceStatus> {
  const configured =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  if (!configured) return { ok: false, label: 'Not configured', detail: 'Cloudinary environment variables are missing.' };

  const start = Date.now();
  try {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    await cloudinary.api.ping();
    return { ok: true, label: 'Connected', detail: 'Admin API ping succeeded.', latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, label: 'Unreachable', detail: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function checkEnv(): ServiceStatus {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length === 0) return { ok: true, label: 'All set', detail: `${REQUIRED_ENV_VARS.length} required variables present.` };
  return { ok: false, label: `${missing.length} missing`, detail: missing.join(', ') };
}

export async function getSystemHealth() {
  const [database, cloudinaryStatus, totalUsers, totalProducts, totalFarmers, totalBuyerRequests] = await Promise.all([
    checkDatabase(),
    checkCloudinary(),
    prisma.user.count(),
    prisma.product.count({ where: { status: { not: 'REMOVED' } } }),
    prisma.user.count({ where: { role: 'FARMER' } }),
    prisma.wantedListing.count(),
  ]);

  return {
    database,
    cloudinary: cloudinaryStatus,
    env: checkEnv(),
    appVersion: pkg.version,
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    // Vercel sets these at build time — absent entirely outside Vercel (local dev, other hosts).
    deployment: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
      env: process.env.VERCEL_ENV ?? null,
    },
    counts: { totalUsers, totalProducts, totalFarmers, totalBuyerRequests },
  };
}
