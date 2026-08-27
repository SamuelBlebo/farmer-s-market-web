export const PLATFORM_NAME = process.env.NEXT_PUBLIC_PLATFORM_NAME ?? 'Farmers Market';

// Used to build absolute URLs for metadataBase and Open Graph images —
// social platforms (WhatsApp, Twitter) require absolute, not relative, URLs.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Support contact points shown on /support. The WhatsApp number is optional —
// the button on /support only renders when it's actually configured.
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@farmersmarket.gh';
export const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '';

export const REGIONS = [
  'Greater Accra', 'Ashanti', 'Bono', 'Bono East', 'Ahafo', 'Eastern', 'Central',
  'Western', 'Western North', 'Volta', 'Oti', 'Northern', 'Savannah',
  'North East', 'Upper East', 'Upper West',
] as const;

export const UNITS = [
  'kg', '50kg bag', '100kg bag', 'crate', 'tonne', 'bunch', 'basket',
  'piece', 'bird', 'tuber', '100 tubers', 'box',
] as const;

export const CATEGORIES = [
  { name: 'Vegetables', slug: 'vegetables', emoji: '🍅' },
  { name: 'Fruits', slug: 'fruits', emoji: '🍍' },
  { name: 'Grains', slug: 'grains', emoji: '🌽' },
  { name: 'Tubers', slug: 'tubers', emoji: '🍠' },
  { name: 'Legumes', slug: 'legumes', emoji: '🫘' },
  { name: 'Poultry', slug: 'poultry', emoji: '🐔' },
  { name: 'Livestock', slug: 'livestock', emoji: '🐐' },
  { name: 'Eggs', slug: 'eggs', emoji: '🥚' },
  { name: 'Other', slug: 'other', emoji: '🌿' },
];

export const SORTS = {
  newest: 'Newest first',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  quantity: 'Largest quantity',
} as const;
export type SortKey = keyof typeof SORTS;
