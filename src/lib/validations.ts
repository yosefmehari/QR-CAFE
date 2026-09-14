import { z, ZodError } from 'zod'

// ─── CUSTOMER ORDER SCHEMAS ──────────────────────────────────────────────────

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID cannot be empty'),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(20, 'Maximum 20 of any single item allowed per order'),
  notes: z
    .string()
    .max(150, 'Special instructions cannot exceed 150 characters')
    .optional()
    .nullable(),
})

export const createOrderSchema = z.object({
  tableNumber: z
    .number()
    .int('Table number must be an integer')
    .min(1, 'Table number must be at least 1'),
  notes: z
    .string()
    .max(300, 'Order notes cannot exceed 300 characters')
    .optional()
    .nullable(),
  paymentMethod: z
    .enum(['CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'CASH', 'BANK_TRANSFER'] as const)
    .default('CARD'),
  paymentScreenshot: z.string().optional().nullable(),
  cardDetails: z
    .object({
      cardholderName: z.string().optional(),
      cardNumber: z.string().optional(),
      expiry: z.string().optional(),
      cvc: z.string().optional(),
    })
    .optional()
    .nullable(),
  bankTransferDetails: z
    .object({
      senderName: z.string().optional(),
      transactionReference: z.string().optional().nullable(),
      screenshotUrl: z.string().optional().nullable(),
      bankUsed: z.string().optional(),
    })
    .optional()
    .nullable(),
  items: z
    .array(orderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(50, 'Orders cannot exceed 50 distinct line items'),
})

// ─── CAFE SETTINGS SCHEMAS ───────────────────────────────────────────────────

export const updateCafeSettingsSchema = z.object({
  bankName: z.string().min(2, 'Bank name must be at least 2 characters'),
  bankAccountNumber: z.string().min(5, 'Bank account number must be at least 5 characters'),
  accountHolderName: z.string().min(2, 'Account holder name must be at least 2 characters'),
  telebirrNumber: z.string().optional().nullable(),
  paymentInstructions: z.string().max(500, 'Instructions cannot exceed 500 characters').optional().nullable(),
})

// ─── AUTHENTICATION SCHEMAS ──────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long'),
})

// ─── ADMIN CATEGORY SCHEMAS ──────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name cannot exceed 50 characters'),
  slug: z.string().trim().optional().nullable(),
  emoji: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().default(0),
})

export const updateCategorySchema = createCategorySchema.partial()

// ─── ADMIN PRODUCT SCHEMAS ───────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(100, 'Product name cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable(),
  price: z
    .number()
    .positive('Price must be greater than $0')
    .max(999.99, 'Price cannot exceed $999.99'),
  categoryId: z.string().min(1, 'Category is required'),
  imageUrl: z
    .string()
    .trim()
    .max(1000, 'Image URL too long')
    .optional()
    .nullable(),
  isAvailable: z.boolean().default(true),
})

export const updateProductSchema = createProductSchema.partial()

// ─── ADMIN TABLE SCHEMAS ─────────────────────────────────────────────────────

export const createTableSchema = z.object({
  number: z
    .number()
    .int('Table number must be an integer')
    .positive('Table number must be positive')
    .max(200, 'Table number cannot exceed 200'),
  name: z.string().trim().max(50).optional().nullable(),
  capacity: z
    .number()
    .int()
    .min(1, 'Capacity must be at least 1 person')
    .max(30, 'Capacity cannot exceed 30 seats')
    .default(4),
  isActive: z.boolean().default(true),
})

export const updateTableSchema = createTableSchema.partial()

// ─── ORDER STATUS SCHEMAS ────────────────────────────────────────────────────

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'] as const).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED'] as const).optional(),
  paymentReference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// ─── HELPER: FORMAT ZOD ERRORS ───────────────────────────────────────────────

export function formatZodError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((e) => `${e.path.join('.') || 'field'}: ${e.message}`).join(', ')
  }
  if (
    error &&
    typeof error === 'object' &&
    'issues' in error &&
    Array.isArray((error as { issues: unknown[] }).issues)
  ) {
    const issues = (
      error as { issues: Array<{ path?: (string | number)[]; message?: string }> }
    ).issues
    return issues.map((e) => `${e.path?.join('.') || 'field'}: ${e.message || 'invalid'}`).join(', ')
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Validation error'
}
