import { z } from 'zod';

/**
 * Validation schemas for cart and coupon operations
 * Centralized, reusable, and type-safe
 */

export const AddToCartSchema = z.object({
  productId: z.string().cuid('Invalid product ID').min(1),
  quantity: z.number().int().min(1).max(1000),
  anonymousId: z.string().optional(),
});

export const ApplyCouponSchema = z.object({
  cartId: z.string().cuid('Invalid cart ID').min(1),
  couponCode: z.string().min(1).max(50).trim(),
});

export const RemoveCouponSchema = z.object({
  cartId: z.string().cuid('Invalid cart ID').min(1),
});

export const UpdateCartItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID').min(1),
  quantity: z.number().int().min(0).max(1000),
  anonymousId: z.string().optional().nullable(),
});

export const RemoveCartItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID').min(1),
  anonymousId: z.string().optional().nullable(),
});

export const CheckoutSchema = z.object({
  shippingInfo: z.object({
    address: z.string().min(5).max(255),
    city: z.string().min(2).max(100),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    phone: z.string().optional(),
  }),
});

/**
 * Safe validation wrapper with error handling
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { valid: true; data: T } | { valid: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { valid: false, error: messages };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type ApplyCouponInput = z.infer<typeof ApplyCouponSchema>;
export type RemoveCouponInput = z.infer<typeof RemoveCouponSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof RemoveCartItemSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
