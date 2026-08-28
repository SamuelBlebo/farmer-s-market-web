'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type SupportWidgetContextValue = {
  open: boolean;
  openSupport: () => void;
  closeSupport: () => void;
  toggleSupport: () => void;
};

const SupportWidgetContext = createContext<SupportWidgetContextValue | null>(null);

export function useSupportWidget() {
  const ctx = useContext(SupportWidgetContext);
  if (!ctx) throw new Error('useSupportWidget must be used within SupportWidgetProvider');
  return ctx;
}

/** Mounted once at the root layout — lets anything on any page (the floating button, a notification feed link) open the support panel without navigation. */
export function SupportWidgetProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openSupport = useCallback(() => setOpen(true), []);
  const closeSupport = useCallback(() => setOpen(false), []);
  const toggleSupport = useCallback(() => setOpen((v) => !v), []);

  return (
    <SupportWidgetContext.Provider value={{ open, openSupport, closeSupport, toggleSupport }}>
      {children}
    </SupportWidgetContext.Provider>
  );
}
