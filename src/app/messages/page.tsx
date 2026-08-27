import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MessageIcon } from '@/components/icons';
import { chatTimeLabel } from '@/lib/format';
import { requireUser } from '@/server/authz';
import { getConversations } from '@/server/chat';

export const metadata: Metadata = { title: 'Messages' };

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await getConversations(user.id);

  return (
    <div className="mx-auto max-w-[640px]">
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
        <div className="card divide-y divide-line overflow-hidden rounded-2xl shadow-sm">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper"
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
          ))}
        </div>
      )}
    </div>
  );
}
