'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { ChatWidget } from './chat-widget';

type ChatWidgetContextValue = {
  openChat: (conversationId: string) => void;
  closeChat: () => void;
};

const ChatWidgetContext = createContext<ChatWidgetContextValue | null>(null);

export function useChatWidget() {
  const ctx = useContext(ChatWidgetContext);
  if (!ctx) throw new Error('useChatWidget must be used within ChatWidgetProvider');
  return ctx;
}

/** Mounted once at the root layout — lets any Chat button on any page pop the floating widget open without navigating away. */
export function ChatWidgetProvider({ children }: { children: React.ReactNode }) {
  const [conversationId, setConversationId] = useState<string | null>(null);

  const openChat = useCallback((id: string) => setConversationId(id), []);
  const closeChat = useCallback(() => setConversationId(null), []);

  return (
    <ChatWidgetContext.Provider value={{ openChat, closeChat }}>
      {children}
      {conversationId && <ChatWidget conversationId={conversationId} onClose={closeChat} />}
    </ChatWidgetContext.Provider>
  );
}
