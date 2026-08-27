import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ConversationThread } from '@/components/conversation-thread';
import { ChevronLeftIcon } from '@/components/icons';
import { requireUser } from '@/server/authz';
import { getConversation } from '@/server/chat';

export const metadata: Metadata = { title: 'Conversation' };

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const conversation = await getConversation(params.id, user.id);
  if (!conversation) notFound();

  return (
    <div className="mx-auto max-w-[640px]">
      <Link href="/messages" className="btn-ghost mb-4 inline-flex items-center gap-1">
        <ChevronLeftIcon className="h-4 w-4" /> Messages
      </Link>

      <div className="mb-3 flex items-center gap-3">
        <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light text-base font-extrabold text-leaf-dark">
          {conversation.otherAvatar ? (
            <Image src={conversation.otherAvatar} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            conversation.otherName[0]
          )}
        </div>
        <div className="min-w-0 flex-1">
          {conversation.otherFarmerProfileId ? (
            <Link href={`/farmers/${conversation.otherFarmerProfileId}`} className="truncate text-[17px] font-bold tracking-tight hover:underline">
              {conversation.otherName}
            </Link>
          ) : (
            <p className="truncate text-[17px] font-bold tracking-tight">{conversation.otherName}</p>
          )}
          {conversation.product && (
            <Link href={`/products/${conversation.product.id}`} className="truncate text-[13px] text-muted hover:underline">
              Re: {conversation.product.name}
            </Link>
          )}
        </div>
      </div>

      <ConversationThread
        conversationId={conversation.id}
        currentUserId={user.id}
        productName={conversation.product?.name}
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          type: m.type,
          content: m.content,
          audioUrl: m.audioUrl,
          audioDurationSec: m.audioDurationSec,
          createdAt: m.createdAt.toISOString(),
          readAt: m.readAt ? m.readAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
