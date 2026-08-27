/**
 * Single seam for outbound email — same pattern as captureException in
 * monitoring.ts. No provider is configured today, so this just logs; swap
 * the body for Resend/SendGrid/SES once one is wired up and every call site
 * below starts actually delivering mail for free. Never throws — a failed
 * or unconfigured send should degrade, not break the caller's request.
 */
export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }): Promise<void> {
  try {
    // eslint-disable-next-line no-console
    console.log('[email]', { to, subject, text });
  } catch {
    // Email is best-effort — never let a logging failure break the caller.
  }
}
