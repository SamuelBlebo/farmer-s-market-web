'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { markConversationRead, sendMessage, sendVoiceMessage } from '@/server/actions/chat';
import { chatTimeLabel } from '@/lib/format';
import { CloseIcon, MicIcon, SendIcon } from './icons';
import { useToast } from './toast-provider';

export type ChatMessage = {
  id: string;
  senderId: string;
  type: 'TEXT' | 'VOICE';
  content: string;
  audioUrl: string | null;
  audioDurationSec: number | null;
  createdAt: string;
  readAt: string | null;
};

// Vercel's serverless target has no persistent WebSocket support, so a short
// poll stands in for real-time push — good enough at this app's scale.
const POLL_MS = 4000;
const MAX_RECORD_SECONDS = 120;

/** Canned starters shown only before the first message — same fast-path Jiji-style marketplace chats use. */
function quickReplies(productName?: string | null): string[] {
  return [
    productName ? `Is the ${productName} still available?` : 'Is this still available?',
    "What's your best price?",
    'Can you deliver to my location?',
    'When can I come pick it up?',
  ];
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ConversationThread({
  conversationId,
  currentUserId,
  initialMessages,
  productName,
  compact = false,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  /** Feeds the "Is the X still available?" quick reply — omit for a generic one. */
  productName?: string | null;
  /** Shrinks the thread to fill its parent instead of a fixed 70vh — for the floating widget. */
  compact?: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [isSending, startTransition] = useTransition();
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAtRef = useRef(initialMessages.at(-1)?.createdAt ?? new Date(0).toISOString());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toast = useToast();

  useEffect(() => {
    setMicSupported(typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  // Release the microphone if the widget/page goes away mid-recording.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages?after=${encodeURIComponent(lastAtRef.current)}`);
        if (!res.ok) return;
        const data: { messages: ChatMessage[] } = await res.json();
        if (data.messages?.length) {
          setMessages((prev) => [...prev, ...data.messages]);
          lastAtRef.current = data.messages[data.messages.length - 1].createdAt;
          if (data.messages.some((m) => m.senderId !== currentUserId)) markConversationRead(conversationId);
        }
      } catch {
        // Transient network hiccup — the next tick retries.
      }
    }
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [conversationId, currentUserId]);

  async function pollLatest() {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?after=${encodeURIComponent(lastAtRef.current)}`);
      if (res.ok) {
        const data: { messages: ChatMessage[] } = await res.json();
        if (data.messages?.length) {
          setMessages((prev) => [...prev, ...data.messages]);
          lastAtRef.current = data.messages[data.messages.length - 1].createdAt;
        }
      }
    } catch {
      // Sent fine either way — the poll interval will pick it up.
    }
  }

  async function sendContent(content: string): Promise<boolean> {
    const formData = new FormData();
    formData.set('content', content);
    formData.set('conversationId', conversationId);
    const result = await sendMessage({}, formData);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    await pollLatest();
    return true;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const content = String(new FormData(form).get('content') ?? '').trim();
    if (!content) return;

    startTransition(async () => {
      if (await sendContent(content)) form.reset();
    });
  }

  function handleQuickReply(text: string) {
    startTransition(async () => {
      await sendContent(text);
    });
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Voice notes are not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(
        (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t),
      );
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s + 1 >= MAX_RECORD_SECONDS) stopRecording(true);
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error('Microphone access was blocked — allow it to send a voice note.');
    }
  }

  function stopRecording(send: boolean) {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setRecording(false);

    if (!send) {
      recorder.stop();
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      return;
    }

    const duration = Math.max(1, recordSeconds);
    recorder.addEventListener(
      'stop',
      () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        chunksRef.current = [];
        void uploadAndSendVoice(blob, duration);
      },
      { once: true },
    );
    recorder.stop();
    mediaRecorderRef.current = null;
  }

  async function uploadAndSendVoice(blob: Blob, durationSec: number) {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloud || !preset) {
      toast.error('Voice notes are not set up yet.');
      return;
    }
    setUploadingVoice(true);
    try {
      const body = new FormData();
      body.append('file', blob, `voice-note.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`);
      body.append('upload_preset', preset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/video/upload`, { method: 'POST', body });
      if (!res.ok) throw new Error('upload failed');
      const data = await res.json();

      const result = await sendVoiceMessage(conversationId, data.secure_url, durationSec);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      await pollLatest();
    } catch {
      toast.error('That voice note did not send. Check your connection and try again.');
    } finally {
      setUploadingVoice(false);
    }
  }

  return (
    <div className={compact ? 'flex h-full flex-col' : 'flex h-[70vh] flex-col'}>
      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-line bg-paper p-3">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted">Say hello — messages are private between you two.</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-[14px] ${mine ? 'bg-leaf text-white' : 'bg-white text-ink shadow-sm'}`}>
                {m.type === 'VOICE' && m.audioUrl ? (
                  <div className="flex items-center gap-1.5">
                    <MicIcon className={`h-3.5 w-3.5 shrink-0 ${mine ? 'text-white/80' : 'text-muted'}`} />
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <audio controls preload="none" src={m.audioUrl} className="h-8 max-w-[190px]" />
                    {m.audioDurationSec != null && (
                      <span className={`font-num shrink-0 text-[11px] ${mine ? 'text-white/70' : 'text-muted'}`}>
                        {formatClock(m.audioDurationSec)}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                )}
                <p className={`mt-0.5 text-right text-[10.5px] ${mine ? 'text-white/70' : 'text-muted'}`}>
                  {chatTimeLabel(new Date(m.createdAt))}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {messages.length === 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quickReplies(productName).map((text) => (
            <button
              key={text}
              type="button"
              disabled={isSending}
              onClick={() => handleQuickReply(text)}
              className="rounded-full border border-line bg-white px-2.5 py-1 text-[12px] font-semibold text-leaf-dark transition-colors hover:bg-leaf-light disabled:opacity-60"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {recording ? (
        <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-line bg-white px-3 py-2.5">
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-clay" aria-hidden />
          <span className="font-num flex-1 text-sm font-semibold text-ink">{formatClock(recordSeconds)}</span>
          <button
            type="button"
            onClick={() => stopRecording(false)}
            aria-label="Cancel recording"
            className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-paper"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => stopRecording(true)} className="btn inline-flex shrink-0 items-center gap-1.5 !px-4">
            <SendIcon className="h-4 w-4" /> Send
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
          <textarea
            name="content"
            rows={1}
            maxLength={2000}
            placeholder="Type a message…"
            required
            className="input flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <input type="hidden" name="conversationId" value={conversationId} />
          {micSupported && (
            <button
              type="button"
              onClick={startRecording}
              disabled={isSending || uploadingVoice}
              aria-label="Record a voice note"
              className="btn-ghost inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center !p-0"
            >
              <MicIcon className="h-4 w-4" />
            </button>
          )}
          <button type="submit" disabled={isSending || uploadingVoice} className="btn inline-flex shrink-0 items-center gap-1.5 !px-4">
            <SendIcon className="h-4 w-4" /> Send
          </button>
        </form>
      )}
      {uploadingVoice && <p className="mt-1.5 text-[12px] text-muted">Sending voice note…</p>}
    </div>
  );
}
