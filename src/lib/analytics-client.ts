'use client';

type ClientEventType = 'WHATSAPP_CLICKED' | 'CALL_CLICKED' | 'SEARCH_PERFORMED';

/** Fire-and-forget beacon for click/search events — keepalive so it survives the page navigating away right after. */
export function trackClient(type: ClientEventType, entityId?: string, metadata?: string) {
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, entityId, metadata }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics should never throw into the caller's click handler.
  }
}
