import { z } from 'zod';

/** Vietnamese phone number validation (accepts 0xxx, +84xxx, spaces, dots, dashes) */
export const phoneSchema = z
  .string()
  .transform((val) => (val ? val.trim().replace(/[\s\.-]/g, '') : ''))
  .refine(
    (val) => !val || /^(\+84|0)\d{9,10}$/.test(val),
    {
      message: 'Số điện thoại không hợp lệ (Ví dụ: 0912345678)',
    }
  )
  .optional()
  .nullable();

/** Positive number validation */
export const positiveNumber = z.coerce
  .number({ invalid_type_error: 'Giá trị phải là chữ số' })
  .positive('Số lượng phải lớn hơn 0');

/** Non-negative number validation */
export const nonNegativeNumber = z.coerce
  .number({ invalid_type_error: 'Giá trị phải là chữ số' })
  .min(0, 'Giá trị không được âm');

/** Positive amount for monetary values */
export const positiveAmount = z.coerce
  .number({ invalid_type_error: 'Số tiền phải là chữ số' })
  .int('Số tiền phải là số nguyên (VND)')
  .positive('Số tiền phải lớn hơn 0');

/** Non-negative amount for monetary values */
export const nonNegativeAmount = z.coerce
  .number({ invalid_type_error: 'Số tiền phải là chữ số' })
  .int('Số tiền phải là số nguyên (VND)')
  .min(0, 'Số tiền không được âm');

/** Required non-empty string */
export const requiredString = z
  .string({ required_error: 'Trường này không được để trống' })
  .min(1, 'Trường này không được để trống')
  .trim();

/** UUID v7 validation */
export const uuidSchema = z.string().uuid('Mã định danh ID không hợp lệ');
