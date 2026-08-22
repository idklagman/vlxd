import { z } from 'zod';

// 1. Report Date Range & Scope Filter Schema
export const reportFilterSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu phải theo định dạng YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc phải theo định dạng YYYY-MM-DD').optional(),
  warehouseId: z.string().uuid('Kho hàng không hợp lệ').optional(),
  customerId: z.string().uuid('Khách hàng không hợp lệ').optional(),
  projectId: z.string().uuid('Công trình không hợp lệ').optional(),
});
export type ReportFilterInput = z.infer<typeof reportFilterSchema>;

// 2. Inventory Valuation Filter Schema
export const inventoryValuationFilterSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});
export type InventoryValuationFilterInput = z.infer<typeof inventoryValuationFilterSchema>;
