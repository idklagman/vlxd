import { z } from 'zod';
import { positiveAmount, nonNegativeAmount } from '../utils/validation';
import { PaymentMethod, CashFlowType } from '../constants/enums';

// 1. Create Payment Receipt (Phiếu Thu tiền)
export const createPaymentReceiptSchema = z.object({
  customerId: z.string().uuid('Khách hàng không hợp lệ'),
  projectId: z.string().uuid('Công trình không hợp lệ').optional().nullable(),
  salesOrderId: z.string().uuid('Đơn hàng không hợp lệ').optional().nullable(),
  paymentMethod: z.enum([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER], {
    errorMap: () => ({ message: 'Phương thức thanh toán phải là CASH (tiền mặt) hoặc BANK_TRANSFER (chuyển khoản)' }),
  }).default(PaymentMethod.CASH),
  amount: positiveAmount,
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày thu tiền phải theo định dạng YYYY-MM-DD'),
  payerReceiverName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type CreatePaymentReceiptInput = z.infer<typeof createPaymentReceiptSchema>;

// 2. Create Payment Spend Voucher (Phiếu Chi tiền)
export const createPaymentSpendSchema = z.object({
  supplierId: z.string().uuid('Nhà cung cấp không hợp lệ').optional().nullable(),
  purchaseId: z.string().uuid('Đơn nhập hàng không hợp lệ').optional().nullable(),
  paymentMethod: z.enum([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER], {
    errorMap: () => ({ message: 'Phương thức thanh toán phải là CASH (tiền mặt) hoặc BANK_TRANSFER (chuyển khoản)' }),
  }).default(PaymentMethod.CASH),
  category: z.string().trim().min(1, 'Khoản mục chi không được để trống').default('TRA_TIEN_NCC'),
  amount: positiveAmount,
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày chi tiền phải theo định dạng YYYY-MM-DD'),
  payerReceiverName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type CreatePaymentSpendInput = z.infer<typeof createPaymentSpendSchema>;

// 3. Debt Query Filter Schema
export const debtFilterSchema = z.object({
  customerId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type DebtFilterInput = z.infer<typeof debtFilterSchema>;

// 4. Cash Flow Filter Schema
export const cashFlowFilterSchema = z.object({
  accountType: z.enum(['CASH', 'BANK']).optional(),
  direction: z.enum([CashFlowType.IN, CashFlowType.OUT]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type CashFlowFilterInput = z.infer<typeof cashFlowFilterSchema>;
