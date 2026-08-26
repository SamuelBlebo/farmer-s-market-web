'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/monitoring';

/** Catches errors React's own boundaries don't — uncaught exceptions and unhandled promise rejections anywhere on the page. */
export function ErrorMonitor() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      captureException(event.error ?? event.message, { source: 'window.onerror' });
    }
    function onRejection(event: PromiseRejectionEvent) {
      captureException(event.reason, { source: 'unhandledrejection' });
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
