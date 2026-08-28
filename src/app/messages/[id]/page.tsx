import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/server/authz';
import { getConversation } from '@/server/chat';

/**
 * Old direct-link shape from before the split-view inbox — still worth
 * honoring for anyone's saved bookmark or a link shared before this
 * changed, but the real experience now lives at /messages?id=... .
 */
export default async function ConversationRedirectPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const conversation = await getConversation(params.id, user.id);
  if (!conversation) notFound();

  redirect(`/messages?id=${params.id}`);
}
