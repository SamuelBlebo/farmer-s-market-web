import type { Metadata } from 'next';
import { InboxConversationRow } from '@/components/inbox-conversation-row';
import { MessageIcon } from '@/components/icons';
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
            <InboxConversationRow key={c.id} conversation={c} />
          ))}
        </div>
      )}
    </div>
  );
}
