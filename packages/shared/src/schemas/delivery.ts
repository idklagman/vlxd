import { z } from 'zod';
import { positiveNumber, nonNegativeAmount, phoneSchema } from '../utils/validation';

// 1. Delivery Item Input Schema
export const deliveryItemSchema = z.object({
  salesOrderItemId: z.string().uuid().optional().nullable(),
  productVariantId: z.string().uuid('Biến thể sản phẩm không hợp lệ'),
  quantity: positiveNumber,
  unitId: z.string().uuid('Đơn vị tính không hợp lệ'),
  notes: z.string().optional().nullable(),
});
export type DeliveryItemInput = z.infer<typeof deliveryItemSchema>;

// 2. Create Delivery Trip Schema
export const createDeliverySchema = z.object({
  salesOrderId: z.string().uuid('Đơn hàng không hợp lệ'),
  vehicleId: z.string().uuid('Xe giao hàng không hợp lệ').optional().nullable(),
  driverId: z.string().uuid('Tài xế không hợp lệ').optional().nullable(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày giao hàng phải theo định dạng YYYY-MM-DD'),
  deliveryAddress: z.string().optional().nullable(),
  deliveryContactName: z.string().optional().nullable(),
  deliveryContactPhone: phoneSchema,
  shippingFee: nonNegativeAmount.default(0),
  driverCost: nonNegativeAmount.default(0),
  notes: z.string().optional().nullable(),
  items: z.array(deliveryItemSchema).min(1, 'Chuyến xe phải có ít nhất 1 mặt hàng'),
});
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;

// 3. Delivery Query Filter Schema
export const deliveryFilterSchema = z.object({
  salesOrderId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type DeliveryFilterInput = z.infer<typeof deliveryFilterSchema>;
