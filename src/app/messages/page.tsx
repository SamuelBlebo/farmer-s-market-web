import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ConversationThread } from '@/components/conversation-thread';
import { InboxConversationRow } from '@/components/inbox-conversation-row';
import { MessageIcon } from '@/components/icons';
import { chatTimeLabel } from '@/lib/format';
import { requireUser } from '@/server/authz';
import { getConversation, getConversations } from '@/server/chat';

export const metadata: Metadata = { title: 'Messages' };

export default async function MessagesPage({ searchParams }: { searchParams: { id?: string } }) {
  const user = await requireUser();
  const conversations = await getConversations(user.id);
  // Nothing picked yet — the most recent conversation opens by default, same as any inbox.
  const activeId = searchParams.id ?? conversations[0]?.id;
  const active = activeId ? await getConversation(activeId, user.id) : null;

  return (
    <div className="mx-auto max-w-[1040px]">
      <p className="eyebrow">Inbox</p>
      <h1 className="mb-4 mt-1 text-2xl font-bold tracking-tight">Messages</h1>

      {conversations.length === 0 ? (
        <div className="card p-10 text-center">
          <MessageIcon className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-2 text-sm font-semibold text-muted">No conversations yet.</p>
          <p className="mt-1 text-[13px] text-muted">
            Start a chat from a listing or a farmer&apos;s page — it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="sm:grid sm:grid-cols-[260px_1fr] sm:items-start sm:gap-4 lg:grid-cols-[340px_1fr]">
          <div className="card divide-y divide-line overflow-hidden rounded-2xl shadow-sm">
            {conversations.map((c) => (
              <div key={c.id}>
                {/* Narrow phones only — opens the floating widget, same as before. */}
                <div className="sm:hidden">
                  <InboxConversationRow conversation={c} />
                </div>
                {/* Anything wide enough for a split view — a plain link that swaps the right-hand pane. */}
                <Link
                  href={`/messages?id=${c.id}`}
                  className={`hidden items-center gap-3 px-4 py-3 transition-colors sm:flex ${
                    c.id === activeId ? 'bg-paper' : 'hover:bg-paper'
                  }`}
                >
                  <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light text-base font-extrabold text-leaf-dark">
                    {c.otherAvatar ? (
                      <Image src={c.otherAvatar} alt="" fill sizes="44px" className="object-cover" />
                    ) : (
                      c.otherName[0]
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-[15px] ${c.unreadCount > 0 ? 'font-bold' : 'font-semibold'}`}>{c.otherName}</span>
                      <span className="shrink-0 text-[12px] text-muted">{chatTimeLabel(c.lastMessageAt)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={`truncate text-[13px] ${c.unreadCount > 0 ? 'font-semibold text-ink' : 'text-muted'}`}>
                        {c.productName && <span className="text-muted">Re: {c.productName} — </span>}
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
              </div>
            ))}
          </div>

          <div className="hidden sm:block">
            {active ? (
              <div className="card flex h-[calc(100vh-220px)] min-h-[420px] flex-col p-4">
                <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
                  <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light text-base font-extrabold text-leaf-dark">
                    {active.otherAvatar ? (
                      <Image src={active.otherAvatar} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      active.otherName[0]
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {active.otherFarmerProfileId ? (
                      <Link href={`/farmers/${active.otherFarmerProfileId}`} className="block truncate text-[16px] font-bold hover:underline">
                        {active.otherName}
                      </Link>
                    ) : (
                      <p className="truncate text-[16px] font-bold">{active.otherName}</p>
                    )}
                    {active.product && <p className="truncate text-[12.5px] text-muted">Re: {active.product.name}</p>}
                  </div>
                </div>
                <div className="min-h-0 flex-1">
                  <ConversationThread
                    conversationId={active.id}
                    currentUserId={user.id}
                    productName={active.product?.name}
                    initialMessages={active.messages.map((m) => ({
                      id: m.id,
                      senderId: m.senderId,
                      type: m.type,
                      content: m.content,
                      audioUrl: m.audioUrl,
                      audioDurationSec: m.audioDurationSec,
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
