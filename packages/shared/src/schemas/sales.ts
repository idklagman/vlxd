import { z } from 'zod';
import { nonNegativeAmount, positiveNumber, phoneSchema } from '../utils/validation';
import { OrderStatus } from '../constants/enums';

// 1. Sales Order Item Input Schema
export const salesOrderItemSchema = z.object({
  productVariantId: z.string().uuid('Biến thể sản phẩm không hợp lệ'),
  inputQuantity: positiveNumber,
  inputUnitId: z.string().uuid('Đơn vị bán không hợp lệ'),
  unitPrice: nonNegativeAmount,
  discountAmount: nonNegativeAmount.default(0),
  notes: z.string().optional().nullable(),
});
export type SalesOrderItemInput = z.infer<typeof salesOrderItemSchema>;

// 2. Create / Update Sales Order Schema
export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid('Khách hàng không hợp lệ'),
  projectId: z.string().uuid('Công trình không hợp lệ').optional().nullable(),
  warehouseId: z.string().uuid('Kho xuất hàng không hợp lệ'),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày đặt hàng phải theo định dạng YYYY-MM-DD'),
  deliveryAddress: z.string().optional().nullable(),
  deliveryContactName: z.string().optional().nullable(),
  deliveryContactPhone: phoneSchema,
  discountAmount: nonNegativeAmount.default(0),
  shippingFee: nonNegativeAmount.default(0),
  paidAmount: nonNegativeAmount.default(0),
  notes: z.string().optional().nullable(),
  items: z.array(salesOrderItemSchema).min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
});
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;

// 3. Sales Order Query Filter Schema
export const salesOrderFilterSchema = z.object({
  customerId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  status: z.enum([
    OrderStatus.DRAFT,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.DELIVERING,
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
  ]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});
export type SalesOrderFilterInput = z.infer<typeof salesOrderFilterSchema>;
