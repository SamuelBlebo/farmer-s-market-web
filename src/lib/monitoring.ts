/**
 * Single seam for error reporting. Today this just logs — swap the body of
 * captureException for `Sentry.captureException(error, { extra: context })`
 * (or another provider's equivalent) once one is wired up, and every call
 * site below starts reporting for free. No provider SDK is imported here,
 * so this file has zero effect on bundle size or behavior until it's wired.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'test') return;
  // eslint-disable-next-line no-console
  console.error('[monitoring]', error, context ?? {});
}
