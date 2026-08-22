import { z } from 'zod';
import { positiveAmount } from '../utils/validation';
import { PaymentMethod } from '../constants/enums';

// 1. Create Expense Category Schema
export const createExpenseCategorySchema = z.object({
  code: z.string().trim().min(1, 'Mã loại chi phí không được để trống'),
  name: z.string().trim().min(1, 'Tên loại chi phí không được để trống'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});
export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;

// 2. Create Expense Schema
export const createExpenseSchema = z.object({
  categoryId: z.string().uuid('Loại chi phí không hợp lệ'),
  vehicleId: z.string().uuid('Xe tải không hợp lệ').optional().nullable(),
  driverId: z.string().uuid('Tài xế không hợp lệ').optional().nullable(),
  amount: positiveAmount,
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày chi phải theo định dạng YYYY-MM-DD'),
  paymentMethod: z.enum([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER], {
    errorMap: () => ({ message: 'Phương thức phải là CASH (tiền mặt) hoặc BANK_TRANSFER (chuyển khoản)' }),
  }).default(PaymentMethod.CASH),
  recipientName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// 3. Expense Query Filter Schema
export const expenseFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  paymentMethod: z.enum([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type ExpenseFilterInput = z.infer<typeof expenseFilterSchema>;
