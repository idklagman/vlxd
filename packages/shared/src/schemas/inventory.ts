import { z } from 'zod';
import { nonNegativeAmount, positiveNumber, nonNegativeNumber, requiredString } from '../utils/validation';

// 1. Purchase Item Input Schema
export const purchaseItemInputSchema = z.object({
  productVariantId: z.string().uuid('Biến thể sản phẩm không hợp lệ'),
  inputQuantity: positiveNumber,
  inputUnitId: z.string().uuid('Đơn vị nhập không hợp lệ'),
  unitPrice: nonNegativeAmount,
  notes: z.string().optional().nullable(),
});
export type PurchaseItemInput = z.infer<typeof purchaseItemInputSchema>;

// 2. Create / Update Purchase Schema
export const createPurchaseSchema = z.object({
  supplierId: z.string().uuid('Nhà cung cấp không hợp lệ'),
  warehouseId: z.string().uuid('Kho nhận hàng không hợp lệ'),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày nhập hàng phải theo định dạng YYYY-MM-DD'),
  discountAmount: nonNegativeAmount.default(0),
  paidAmount: nonNegativeAmount.default(0),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseItemInputSchema).min(1, 'Đơn nhập hàng phải có ít nhất 1 sản phẩm'),
});
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

// 3. Inventory Adjustment Schema
export const inventoryAdjustmentItemSchema = z.object({
  productVariantId: z.string().uuid('Biến thể sản phẩm không hợp lệ'),
  newQuantity: nonNegativeNumber,
  notes: z.string().optional().nullable(),
});
export type InventoryAdjustmentItemInput = z.infer<typeof inventoryAdjustmentItemSchema>;

export const createInventoryAdjustmentSchema = z.object({
  warehouseId: z.string().uuid('Kho kiểm kê không hợp lệ'),
  adjustmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kiểm kê phải theo định dạng YYYY-MM-DD'),
  reason: z.string().trim().min(3, 'Vui lòng nhập lý do điều chỉnh kho (tối thiểu 3 ký tự)'),
  items: z.array(inventoryAdjustmentItemSchema).min(1, 'Phiếu kiểm kê phải có ít nhất 1 sản phẩm'),
});
export type CreateInventoryAdjustmentInput = z.infer<typeof createInventoryAdjustmentSchema>;

// 4. Warehouse Transfer Schema
export const warehouseTransferItemSchema = z.object({
  productVariantId: z.string().uuid('Biến thể sản phẩm không hợp lệ'),
  quantity: positiveNumber,
  unitId: z.string().uuid('Đơn vị không hợp lệ'),
});
export type WarehouseTransferItemInput = z.infer<typeof warehouseTransferItemSchema>;

export const createWarehouseTransferSchema = z.object({
  fromWarehouseId: z.string().uuid('Kho xuất hàng không hợp lệ'),
  toWarehouseId: z.string().uuid('Kho nhận hàng không hợp lệ'),
  transferDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày chuyển kho phải theo định dạng YYYY-MM-DD'),
  notes: z.string().optional().nullable(),
  items: z.array(warehouseTransferItemSchema).min(1, 'Phiếu chuyển kho phải có ít nhất 1 sản phẩm'),
}).refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
  message: 'Kho xuất và kho nhập không được trùng nhau',
  path: ['toWarehouseId'],
});
export type CreateWarehouseTransferInput = z.infer<typeof createWarehouseTransferSchema>;

// 5. Inventory Query Filters Schema
export const inventoryFilterSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  belowMinimumStock: z.coerce.boolean().optional(),
});
export type InventoryFilterInput = z.infer<typeof inventoryFilterSchema>;
