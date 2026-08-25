import { z } from 'zod';
import { REGIONS, UNITS } from './constants';

const phone = z
  .string()
  .min(9, 'Enter a valid phone number')
  .regex(/^[\d\s+()-]+$/, 'Digits only');

// Blank input means "no email" rather than a validation failure.
const optionalEmail = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : v),
  z.string().email('Enter a valid email').optional(),
);

export const registerSchema = z
  .object({
    role: z.enum(['FARMER', 'BUYER']),
    name: z.string().min(2, 'Enter your name'),
    businessName: z.string().min(2, 'Enter your farm or business name'),
    email: optionalEmail,
    password: z.string().min(8, 'Use at least 8 characters'),
    phone,
    whatsapp: phone,
    region: z.enum(REGIONS),
    town: z.string().min(2, 'Enter your town'),
    description: z.string().max(500).optional(),
  })
  .strict();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const phoneLoginSchema = z.object({
  phone,
  password: z.string().min(1),
});

export const productSchema = z
  .object({
    name: z.string().min(2, 'Name the produce').max(80),
    categoryId: z.string().min(1, 'Pick a category'),
    description: z.string().max(1000).optional(),
    // Cedis from the form; converted to pesewas server-side.
    price: z.coerce.number().positive('Enter a price').max(1_000_000),
    unit: z.enum(UNITS),
    quantity: z.coerce.number().positive('Enter how much you have').max(1_000_000),
    region: z.enum(REGIONS),
    town: z.string().min(2, 'Enter the town'),
    images: z
      .array(z.object({ url: z.string().url(), publicId: z.string() }))
      .max(5)
      .optional(),
  })
  .strict();

export const productStatusSchema = z.object({
  productId: z.string().min(1),
  status: z.enum(['ACTIVE', 'PAUSED', 'SOLD']),
});

export const wantedSchema = z
  .object({
    productName: z.string().min(2, 'What are you looking for?').max(80),
    quantity: z.string().min(1, 'How much do you need?').max(60),
    region: z.enum(REGIONS),
    town: z.string().min(2, 'Enter the town'),
    neededBy: z.string().optional(),
    description: z.string().max(1000).optional(),
  })
  .strict();

export const reportSchema = z.object({
  productId: z.string().min(1),
  reason: z.string().min(3).max(120),
  details: z.string().max(500).optional(),
});

// Blank input means "no photo change" rather than a validation failure.
const optionalImage = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : v),
  z.string().url('Invalid image').optional(),
);

export const farmerProfileSchema = z
  .object({
    name: z.string().min(2, 'Enter your name'),
    businessName: z.string().min(2, 'Enter your farm name'),
    phone,
    email: optionalEmail,
    region: z.enum(REGIONS),
    town: z.string().min(2, 'Enter your town'),
    image: optionalImage,
  })
  .strict();

export const buyerProfileSchema = z
  .object({
    name: z.string().min(2, 'Enter your name'),
    businessName: z.string().min(2, 'Enter your business name'),
    phone,
    email: optionalEmail,
    image: optionalImage,
  })
  .strict();

export const adminProfileSchema = z
  .object({
    name: z.string().min(2, 'Enter your name'),
    phone,
    // Phone sign-in is blocked for admins (see auth.ts), so email is their only way in — keep it required.
    email: z.string().email('Enter a valid email'),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'Use at least 8 characters'),
  })
  .strict();

export type ProductInput = z.infer<typeof productSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
