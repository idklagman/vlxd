import { z } from 'zod';
import { CustomerType, ProjectStatus, SteelType } from '../constants/enums';
import { phoneSchema } from '../utils/validation';

// 1. Category Schema
export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Tên danh mục không được để trống').max(255),
  description: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
});
export type CategoryInput = z.infer<typeof categorySchema>;

// 2. Brand Schema
export const brandSchema = z.object({
  name: z.string().trim().min(1, 'Tên thương hiệu không được để trống').max(255),
  description: z.string().optional().nullable(),
});
export type BrandInput = z.infer<typeof brandSchema>;

// 3. Unit Schema
export const unitSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, 'Mã đơn vị không được để trống').max(50),
  name: z.string().trim().min(1, 'Tên đơn vị không được để trống').max(100),
});
export type UnitInput = z.infer<typeof unitSchema>;

// 4. Unit Conversion Schema
export const unitConversionSchema = z.object({
  fromUnitId: z.string().uuid('Đơn vị nguồn không hợp lệ'),
  toUnitId: z.string().uuid('Đơn vị đích không hợp lệ'),
  conversionRate: z.coerce.number().positive('Tỷ lệ quy đổi phải lớn hơn 0'),
  productVariantId: z.string().uuid('Biến thể sản phẩm không hợp lệ').optional().nullable(),
}).refine(data => data.fromUnitId !== data.toUnitId, {
  message: 'Đơn vị nguồn và đơn vị đích không được trùng nhau',
  path: ['toUnitId'],
});
export type UnitConversionInput = z.infer<typeof unitConversionSchema>;

// 5. Product Schema
export const productSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, 'Mã sản phẩm không được để trống').max(100),
  name: z.string().trim().min(1, 'Tên sản phẩm không được để trống').max(255),
  categoryId: z.string().uuid('Danh mục sản phẩm không hợp lệ'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});
export type ProductInput = z.infer<typeof productSchema>;

// 6. Product Variant Schema
export const productVariantSchema = z.object({
  productId: z.string().uuid('Sản phẩm không hợp lệ'),
  brandId: z.string().uuid('Thương hiệu không hợp lệ').optional().nullable(),
  name: z.string().trim().min(1, 'Tên biến thể / quy cách không được để trống').max(255),
  sku: z.string().trim().max(100).optional().nullable(),
  specification: z.string().trim().max(255).optional().nullable(),
  baseUnitId: z.string().uuid('Đơn vị cơ sở không hợp lệ'),
  minimumStock: z.coerce.number().min(0, 'Tồn kho tối thiểu không được âm').optional().nullable(),
  isActive: z.boolean().default(true),
  attributes: z.record(z.unknown()).optional().nullable(),
});
export type ProductVariantInput = z.infer<typeof productVariantSchema>;

// 7. Steel Specification Schema
export const steelSpecificationSchema = z.object({
  productVariantId: z.string().uuid('Biến thể sản phẩm không hợp lệ'),
  brandId: z.string().uuid('Thương hiệu không hợp lệ'),
  steelType: z.enum([SteelType.BAR, SteelType.COIL], {
    errorMap: () => ({ message: 'Loại thép phải là BAR (thanh) hoặc COIL (cuộn)' }),
  }),
  standard: z.string().trim().max(100).optional().nullable(),
  diameter: z.coerce.number().positive('Đường kính phải lớn hơn 0'),
  lengthPerBar: z.coerce.number().positive('Chiều dài thanh phải lớn hơn 0').optional().nullable(),
  weightPerMeter: z.coerce.number().positive('Đơn trọng (kg/m) phải lớn hơn 0'),
  weightPerBar: z.coerce.number().positive('Trọng lượng thanh (kg/cây) phải lớn hơn 0').optional().nullable(),
  purchaseUnitId: z.string().uuid('Đơn vị nhập không hợp lệ'),
  saleUnitId: z.string().uuid('Đơn vị bán không hợp lệ'),
  isActive: z.boolean().default(true),
});
export type SteelSpecificationInput = z.infer<typeof steelSpecificationSchema>;

// 8. Warehouse Schema
export const warehouseSchema = z.object({
  name: z.string().trim().min(1, 'Tên kho không được để trống').max(255),
  address: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});
export type WarehouseInput = z.infer<typeof warehouseSchema>;

// 9. Customer Schema
export const customerSchema = z.object({
  name: z.string().trim().min(1, 'Tên khách hàng không được để trống').max(255),
  phone: phoneSchema,
  address: z.string().optional().nullable(),
  customerType: z.enum([
    CustomerType.RETAIL,
    CustomerType.BUILDER,
    CustomerType.CONTRACTOR_TEAM,
    CustomerType.OTHER,
  ], {
    errorMap: () => ({ message: 'Loại khách hàng không hợp lệ' }),
  }).default(CustomerType.RETAIL),
  notes: z.string().optional().nullable(),
});
export type CustomerInput = z.infer<typeof customerSchema>;

// 10. Project Schema
export const projectSchema = z.object({
  customerId: z.string().uuid('Khách hàng không hợp lệ'),
  name: z.string().trim().min(1, 'Tên công trình không được để trống').max(255),
  address: z.string().optional().nullable(),
  contactName: z.string().max(255).optional().nullable(),
  contactPhone: phoneSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu phải theo định dạng YYYY-MM-DD').optional().nullable(),
  status: z.enum([
    ProjectStatus.ACTIVE,
    ProjectStatus.COMPLETED,
    ProjectStatus.ON_HOLD,
  ]).default(ProjectStatus.ACTIVE),
  notes: z.string().optional().nullable(),
});
export type ProjectInput = z.infer<typeof projectSchema>;

// 11. Supplier Schema
export const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Tên nhà cung cấp không được để trống').max(255),
  phone: phoneSchema,
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type SupplierInput = z.infer<typeof supplierSchema>;

// 12. Vehicle Schema
export const vehicleSchema = z.object({
  name: z.string().trim().min(1, 'Tên xe không được để trống').max(255),
  plateNumber: z.string().trim().toUpperCase().min(1, 'Biển số xe không được để trống').max(50),
  type: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

// 13. Driver Schema
export const driverSchema = z.object({
  name: z.string().trim().min(1, 'Tên tài xế không được để trống').max(255),
  phone: phoneSchema,
  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});
export type DriverInput = z.infer<typeof driverSchema>;

