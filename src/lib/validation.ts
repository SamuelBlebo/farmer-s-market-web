import { z } from 'zod';
import { REGIONS, UNITS } from './constants';

const phone = z
  .string()
  .min(9, 'Enter a valid phone number')
  .regex(/^[\d\s+()-]+$/, 'Digits only');

export const registerSchema = z
  .object({
    role: z.enum(['FARMER', 'BUYER']),
    name: z.string().min(2, 'Enter your name'),
    businessName: z.string().min(2, 'Enter your farm or business name'),
    email: z.string().email('Enter a valid email'),
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
      .max(4)
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

export type ProductInput = z.infer<typeof productSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
