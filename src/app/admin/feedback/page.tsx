import type { Metadata } from 'next';
import { timeAgo } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/authz';
import { markFeedbackReviewed } from '@/server/actions/admin';

export const metadata: Metadata = { title: 'Feedback' };

export default async function AdminFeedbackPage() {
  await requireAdmin();

  const feedback = await prisma.feedback.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { user: { select: { name: true, email: true, phone: true } } },
    take: 100,
  });

  const openCount = feedback.filter((f) => f.status === 'OPEN').length;

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="mb-1 mt-1 text-2xl font-bold tracking-tight">Feedback</h1>
      <p className="mb-4 text-[15px] text-muted">
        {openCount === 0 ? 'Nothing new.' : `${openCount} submission${openCount === 1 ? '' : 's'} awaiting review.`}
      </p>

      {feedback.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-bold">No feedback yet.</p>
          <p className="mt-1 text-sm text-muted">Submissions from the floating widget and the support page show up here.</p>
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {feedback.map((f) => (
            <div key={f.id} className={`flex flex-wrap items-start gap-3 p-4 ${f.status === 'REVIEWED' ? 'opacity-60' : ''}`}>
              <div className="min-w-[220px] flex-1">
                <p className="whitespace-pre-wrap text-sm font-semibold">{f.message}</p>
                <p className="mt-1.5 text-[12px] text-muted">
                  {f.user ? (f.user.name ?? f.user.email ?? f.user.phone) : 'Anonymous'} · {timeAgo(f.createdAt)}
                  {f.page && <> · <span className="font-num">{f.page}</span></>}
                </p>
              </div>
              {f.status === 'OPEN' ? (
                <form action={markFeedbackReviewed}>
                  <input type="hidden" name="feedbackId" value={f.id} />
                  <button className="btn-ghost !px-3 !py-1.5 !text-[13px]">Mark reviewed</button>
                </form>
              ) : (
                <span className="badge bg-leaf-light text-leaf-dark">Reviewed</span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
