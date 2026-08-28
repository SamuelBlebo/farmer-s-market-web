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

// Farmers who reach the platform by phone call or USSD rather than the app
// itself — an admin takes their details and sets the account up for them.
export const adminCreateFarmerSchema = z
  .object({
    name: z.string().min(2, "Enter the farmer's name"),
    farmName: z.string().min(2, 'Enter the farm name'),
    phone,
    whatsapp: phone,
    region: z.enum(REGIONS),
    town: z.string().min(2, 'Enter the town'),
    description: z.string().max(500).optional(),
    verified: z.boolean().optional(),
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

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Blank input means "no scheduled harvest" rather than a validation failure.
// "YYYY-MM-DD" from <input type="date">, compared as calendar days — today
// and up to 30 days ahead are allowed, nothing in the past.
const optionalHarvestDate = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : v),
  z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date')
    .refine((v) => new Date(`${v}T00:00:00`) >= startOfToday(), 'Harvest date cannot be in the past')
    .refine((v) => {
      const max = startOfToday();
      max.setDate(max.getDate() + 30);
      return new Date(`${v}T00:00:00`) <= max;
    }, 'Harvest date must be within 30 days')
    .optional(),
);

export const variantSchema = z.object({
  name: z.string().min(1, 'Name the variant').max(40),
  price: z.coerce.number().positive('Enter a price').max(1_000_000),
  quantity: z.coerce.number().positive('Enter a quantity').max(1_000_000).optional(),
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
    images: z
      .array(z.object({ url: z.string().url(), publicId: z.string() }))
      .max(5)
      .optional(),
    expectedHarvestDate: optionalHarvestDate,
    variants: z.array(variantSchema).max(10).optional(),
    deliveryAvailable: z.boolean().optional(),
    deliveryPaidBy: z.enum(['FARMER', 'BUYER']).optional(),
    negotiable: z.boolean().optional(),
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

export const startConversationSchema = z.object({
  farmerUserId: z.string().min(1),
  productId: z.string().min(1).optional(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1, 'Type a message').max(2000),
});

export const sendVoiceMessageSchema = z.object({
  conversationId: z.string().min(1),
  audioUrl: z.string().url(),
  // Cloudinary rounds to whole seconds; cap at 5 minutes to keep notes short.
  durationSec: z.coerce.number().int().min(1).max(300),
});

export const sendSupportMessageSchema = z.object({
  content: z.string().min(1, 'Type a message').max(2000),
});

export const adminReplySupportSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1, 'Type a message').max(2000),
});

export const feedbackSchema = z.object({
  message: z.string().min(5, 'Tell us a bit more').max(2000),
  page: z.string().max(200).optional(),
});

export const reviewSchema = z.object({
  farmerId: z.string().min(1),
  rating: z.coerce.number().int().min(1, 'Pick a rating').max(5),
  comment: z.string().max(1000).optional(),
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
    coverImage: optionalImage,
    description: z.string().max(500).optional(),
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

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    token: z.string().min(1),
    newPassword: z.string().min(8, 'Use at least 8 characters'),
  })
  .strict();

export type ProductInput = z.infer<typeof productSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
