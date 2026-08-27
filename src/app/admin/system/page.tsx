import type { Metadata } from 'next';
import { DocumentIcon, StoreIcon, UserIcon } from '@/components/icons';
import { SectionCard, SectionRow } from '@/components/section-card';
import { StatCard } from '@/components/stat-card';
import { requireAdmin } from '@/server/authz';
import { getSystemHealth, type ServiceStatus } from '@/server/system-health';

export const metadata: Metadata = { title: 'System Health' };

// Health checks hit the database and Cloudinary live — never cache this page.
export const dynamic = 'force-dynamic';

function StatusBadgeInline({ status }: { status: ServiceStatus }) {
  return (
    <span className={`badge ${status.ok ? 'bg-leaf-light text-leaf-dark' : 'bg-clay-light text-clay'}`}>
      {status.ok ? '● ' : '✕ '}
      {status.label}
    </span>
  );
}

function ServiceRow({ name, status }: { name: string; status: ServiceStatus }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold">{name}</p>
        <p className="truncate text-[12.5px] text-muted">
          {status.detail}
          {status.latencyMs !== undefined && ` · ${status.latencyMs}ms`}
        </p>
      </div>
      <StatusBadgeInline status={status} />
    </div>
  );
}

export default async function SystemHealthPage() {
  await requireAdmin();
  const health = await getSystemHealth();

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="mb-1 mt-1 text-2xl font-bold tracking-tight">System Health</h1>
      <p className="mb-4 text-[15px] text-muted">Live status — checked on every load, nothing cached or simulated.</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<UserIcon />} label="Total users" value={health.counts.totalUsers} />
        <StatCard icon={<StoreIcon />} label="Total products" value={health.counts.totalProducts} />
        <StatCard icon={<UserIcon />} label="Total farmers" value={health.counts.totalFarmers} />
        <StatCard icon={<DocumentIcon />} label="Buyer requests" value={health.counts.totalBuyerRequests} />
      </div>

      <div className="mb-5">
        <SectionCard title="Services">
          <div className="divide-y divide-line">
            <ServiceRow name="Database" status={health.database} />
            <ServiceRow name="Cloudinary" status={health.cloudinary} />
            <ServiceRow name="Environment variables" status={health.env} />
          </div>
        </SectionCard>
      </div>

      <div className="mb-5">
        <SectionCard title="Build & Deployment">
          <dl className="divide-y divide-line">
            <SectionRow label="App version" value={health.appVersion} />
            <SectionRow label="Environment" value={health.nodeEnv} />
            <SectionRow
              label="Deployment"
              value={
                health.deployment.commit
                  ? `${health.deployment.commit}${health.deployment.env ? ` (${health.deployment.env})` : ''}`
                  : 'Not available — not running on Vercel'
              }
            />
            {health.deployment.commitMessage && (
              <SectionRow label="Last commit" value={health.deployment.commitMessage} />
            )}
          </dl>
        </SectionCard>
      </div>
    </>
  );
}
