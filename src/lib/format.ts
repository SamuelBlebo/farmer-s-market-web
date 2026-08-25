import type { ProductStatus } from '@prisma/client';
import { PLATFORM_NAME } from './constants';

/** Money is stored in pesewas. 850 -> "GH¢8.50", 52000 -> "GH¢520" */
export function formatPrice(minor: number): string {
  const cedis = minor / 100;
  const hasPesewas = minor % 100 !== 0;
  return `GH¢${cedis.toLocaleString('en-GH', {
    minimumFractionDigits: hasPesewas ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function toMinor(cedis: number): number {
  return Math.round(cedis * 100);
}

export function formatQty(q: number | string): string {
  const n = Number(q);
  return n % 1 === 0 ? n.toLocaleString('en-GH') : n.toFixed(2);
}

/** Ghana numbers -> E.164 digits for wa.me. "024 410 1234" -> "233244101234" */
export function normalizeGhanaPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

export function whatsappProductLink(whatsapp: string, productName: string): string {
  const msg = `Hello, I found your ${productName} listing on ${PLATFORM_NAME}. Is it still available?`;
  return `https://wa.me/${normalizeGhanaPhone(whatsapp)}?text=${encodeURIComponent(msg)}`;
}

export function whatsappWantedLink(whatsapp: string, productName: string): string {
  const msg = `Hello, I saw your request for ${productName} on ${PLATFORM_NAME}. I can supply.`;
  return `https://wa.me/${normalizeGhanaPhone(whatsapp)}?text=${encodeURIComponent(msg)}`;
}

/** "024 410 1234" -> "tel:+233244101234" */
export function telLink(phone: string): string {
  return `tel:+${normalizeGhanaPhone(phone)}`;
}

export function timeAgo(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`;
  return `${Math.floor(days / 30)} month${days < 60 ? '' : 's'} ago`;
}

/** "Active today" / "Active yesterday" / "Last active X hours ago" / older. */
export function lastActiveLabel(date: Date | null): string {
  if (!date) return 'Not active yet';
  const now = new Date();
  const hours = Math.floor((now.getTime() - date.getTime()) / 3_600_000);
  if (hours < 1) return 'Active today';
  if (date.toDateString() === now.toDateString()) return `Last active ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Active yesterday';
  return `Active ${Math.floor(hours / 24)} days ago`;
}

export function harvestDateLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

/** "Available now" / "Harvests tomorrow (12 Sep)" / "Harvests in 5 days (12 Sep)". */
export function harvestLabel(date: Date | null): string {
  if (!date) return 'Available now';
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'Available now';
  if (days === 1) return `Harvests tomorrow (${harvestDateLabel(date)})`;
  return `Harvests in ${days} days (${harvestDateLabel(date)})`;
}

export type ProductLifecycle = 'ONGOING' | 'UPCOMING_HARVEST' | 'AVAILABLE_NOW' | 'SOLD_OUT' | 'PAUSED';

/**
 * Derived, not stored — Product keeps its existing ACTIVE/PAUSED/SOLD/REMOVED
 * status; this layers a richer lifecycle label on top of that plus the
 * optional expectedHarvestDate, so every existing status-based query and
 * filter keeps working unchanged.
 */
export function getProductLifecycle(status: ProductStatus, expectedHarvestDate: Date | null): ProductLifecycle {
  if (status === 'SOLD') return 'SOLD_OUT';
  if (status === 'PAUSED') return 'PAUSED';
  if (!expectedHarvestDate) return 'ONGOING';
  return expectedHarvestDate.getTime() - Date.now() > 0 ? 'UPCOMING_HARVEST' : 'AVAILABLE_NOW';
}

export const LIFECYCLE_LABEL: Record<ProductLifecycle, string> = {
  ONGOING: 'Ongoing',
  UPCOMING_HARVEST: 'Upcoming harvest',
  AVAILABLE_NOW: 'Available now',
  SOLD_OUT: 'Sold out',
  PAUSED: 'Paused',
};
