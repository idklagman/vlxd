import { z } from 'zod';

/** Vietnamese phone number validation (10-11 digits starting with 0) */
export const phoneSchema = z
  .string()
  .regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ')
  .optional()
  .or(z.literal(''));

/** Positive number validation */
export const positiveNumber = z.number().positive('Giá trị phải lớn hơn 0');

/** Non-negative number validation */
export const nonNegativeNumber = z.number().min(0, 'Giá trị không được âm');

/** Positive bigint for monetary values */
export const positiveAmount = z.coerce
  .number()
  .int('Số tiền phải là số nguyên')
  .positive('Số tiền phải lớn hơn 0');

/** Non-negative bigint for monetary values */
export const nonNegativeAmount = z.coerce
  .number()
  .int('Số tiền phải là số nguyên')
  .min(0, 'Số tiền không được âm');

/** Required non-empty string */
export const requiredString = z
  .string()
  .min(1, 'Trường này không được để trống')
  .trim();

/** UUID v7 validation */
export const uuidSchema = z.string().uuid('ID không hợp lệ');
