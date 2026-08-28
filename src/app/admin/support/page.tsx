import type { Metadata } from 'next';
import Link from 'next/link';
import { ChatIcon } from '@/components/icons';
import { SupportThread } from '@/components/support-thread';
import { chatTimeLabel } from '@/lib/format';
import { requireAdmin } from '@/server/authz';
import { getAdminSupportConversation, getAdminSupportConversations } from '@/server/support';

export const metadata: Metadata = { title: 'Support' };

const ROLE_LABEL = { FARMER: 'Farmer', BUYER: 'Buyer', ADMIN: 'Admin' } as const;

export default async function AdminSupportPage({ searchParams }: { searchParams: { id?: string } }) {
  await requireAdmin();
  const conversations = await getAdminSupportConversations();
  const activeId = searchParams.id ?? conversations[0]?.id;
  const active = activeId ? await getAdminSupportConversation(activeId) : null;

  return (
    <div className="mx-auto max-w-[1040px]">
      <p className="eyebrow">Admin</p>
      <h1 className="mb-4 mt-1 text-2xl font-bold tracking-tight">Support</h1>

      {conversations.length === 0 ? (
        <div className="card p-10 text-center">
          <ChatIcon className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-2 text-sm font-semibold text-muted">No support conversations yet.</p>
          <p className="mt-1 text-[13px] text-muted">Messages sent from the site-wide chat widget show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[260px_1fr] sm:items-start lg:grid-cols-[340px_1fr]">
          <div className="card divide-y divide-line overflow-hidden rounded-2xl shadow-sm">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/admin/support?id=${c.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${c.id === activeId ? 'bg-paper' : 'hover:bg-paper'}`}
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-light text-base font-extrabold text-leaf-dark">
                  {c.userName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[15px] ${c.unreadCount > 0 ? 'font-bold' : 'font-semibold'}`}>{c.userName}</span>
                    <span className="shrink-0 text-[12px] text-muted">{chatTimeLabel(c.lastMessageAt)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className={`truncate text-[13px] ${c.unreadCount > 0 ? 'font-semibold text-ink' : 'text-muted'}`}>
                      <span className="text-muted">{ROLE_LABEL[c.userRole]} — </span>
                      {c.lastMessage ?? 'Say hello.'}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-leaf px-1.5 text-[11px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div>
            {active ? (
              <div className="card flex h-[calc(100vh-220px)] min-h-[420px] flex-col p-4">
                <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-leaf-light text-base font-extrabold text-leaf-dark">
                    {active.user.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-bold">{active.user.name}</p>
                    <p className="truncate text-[12.5px] text-muted">{ROLE_LABEL[active.user.role]}</p>
                  </div>
                </div>
                <div className="min-h-0 flex-1">
                  <SupportThread
                    key={active.id}
                    conversationId={active.id}
                    viewerIsAdmin
                    initialMessages={active.messages.map((m) => ({
                      id: m.id,
                      senderId: m.senderId,
                      fromAdmin: m.fromAdmin,
                      content: m.content,
                      createdAt: m.createdAt.toISOString(),
                      readAt: m.readAt ? m.readAt.toISOString() : null,
                    }))}
                    compact
                  />
                </div>
              </div>
            ) : (
              <div className="card grid h-[calc(100vh-220px)] min-h-[420px] place-items-center p-4 text-center text-sm text-muted">
                Select a conversation to view it here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
