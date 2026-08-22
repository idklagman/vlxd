import { pgTable, uuid, varchar, text, integer, boolean, numeric, timestamp, date, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Product Categories
export const productCategories = pgTable('product_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;

// 2. Brands
export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

// 3. Units
export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(), // KG, TON, BAG, M3, PIECE, PALLET, BAR
  name: varchar('name', { length: 100 }).notNull(), // Kilôgam, Tấn, Bao, Mét khối, Viên, Pallet, Cây
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;

// 4. Products
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: uuid('category_id').references(() => productCategories.id).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ([
  index('idx_products_name').on(table.name),
  index('idx_products_code').on(table.code),
  index('idx_products_category').on(table.categoryId),
]));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// 5. Product Variants (Sole owner of baseUnitId)
export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  brandId: uuid('brand_id').references(() => brands.id),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  specification: varchar('specification', { length: 255 }), // e.g. "50kg", "D16 11.7m"
  baseUnitId: uuid('base_unit_id').references(() => units.id).notNull(),
  minimumStock: numeric('minimum_stock', { precision: 18, scale: 6 }),
  isActive: boolean('is_active').notNull().default(true),
  attributes: jsonb('attributes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ([
  index('idx_product_variants_product').on(table.productId),
  index('idx_product_variants_name').on(table.name),
  index('idx_product_variants_brand').on(table.brandId),
]));

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

// 6. Unit Conversions (Global or Variant-Scoped)
export const unitConversions = pgTable('unit_conversions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromUnitId: uuid('from_unit_id').references(() => units.id).notNull(),
  toUnitId: uuid('to_unit_id').references(() => units.id).notNull(),
  conversionRate: numeric('conversion_rate', { precision: 18, scale: 6 }).notNull(), // fromUnit * rate = toUnit
  productVariantId: uuid('product_variant_id').references(() => productVariants.id), // NULL = global
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ([
  index('idx_unit_conversions_units').on(table.fromUnitId, table.toUnitId),
  index('idx_unit_conversions_variant').on(table.productVariantId),
]));

export type UnitConversion = typeof unitConversions.$inferSelect;
export type NewUnitConversion = typeof unitConversions.$inferInsert;

// 7. Steel Specifications (1:1 with steel product variants)
export const steelSpecifications = pgTable('steel_specifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  productVariantId: uuid('product_variant_id').references(() => productVariants.id).notNull().unique(),
  brandId: uuid('brand_id').references(() => brands.id).notNull(),
  steelType: varchar('steel_type', { length: 50 }).notNull(), // BAR, COIL
  standard: varchar('standard', { length: 100 }), // e.g. TCVN 1651-2:2018
  diameter: numeric('diameter', { precision: 18, scale: 6 }).notNull(), // mm (e.g. 16)
  lengthPerBar: numeric('length_per_bar', { precision: 18, scale: 6 }), // m (e.g. 11.7 for bars, NULL for coil)
  weightPerMeter: numeric('weight_per_meter', { precision: 18, scale: 6 }).notNull(), // kg/m (e.g. 1.58)
  weightPerBar: numeric('weight_per_bar', { precision: 18, scale: 6 }), // kg/bar (e.g. 18.486, NULL for coil)
  purchaseUnitId: uuid('purchase_unit_id').references(() => units.id).notNull(), // KG
  saleUnitId: uuid('sale_unit_id').references(() => units.id).notNull(), // BAR for bars, KG for coil
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type SteelSpecification = typeof steelSpecifications.$inferSelect;
export type NewSteelSpecification = typeof steelSpecifications.$inferInsert;

// 8. Warehouses
export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(), // Kho Xi Sắt, Bãi Cát Sỏi Gạch
  address: text('address'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Warehouse = typeof warehouses.$inferSelect;
export type NewWarehouse = typeof warehouses.$inferInsert;

// 9. Customers
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  customerType: varchar('customer_type', { length: 50 }).notNull().default('RETAIL'), // RETAIL, BUILDER, CONTRACTOR_TEAM, OTHER
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ([
  index('idx_customers_name').on(table.name),
  index('idx_customers_phone').on(table.phone),
]));

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

// 10. Projects (Associated with a Customer)
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  contactName: varchar('contact_name', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  startDate: date('start_date'),
  status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, COMPLETED, ON_HOLD
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ([
  index('idx_projects_customer').on(table.customerId),
  index('idx_projects_name').on(table.name),
]));

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

// 11. Suppliers
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ([
  index('idx_suppliers_name').on(table.name),
  index('idx_suppliers_phone').on(table.phone),
]));

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

// 12. Vehicles
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  plateNumber: varchar('plate_number', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 100 }), // Xe tải 3.5T, Xe ben 7m3, Xe ba gác...
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

// 13. Drivers
export const drivers = pgTable('drivers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;

// === Drizzle Relations ===

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  variants: many(productVariants),
  steelSpecs: many(steelSpecifications),
}));

export const unitsRelations = relations(units, ({ many }) => ({
  variants: many(productVariants),
  fromConversions: many(unitConversions, { relationName: 'fromUnit' }),
  toConversions: many(unitConversions, { relationName: 'toUnit' }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  brand: one(brands, {
    fields: [productVariants.brandId],
    references: [brands.id],
  }),
  baseUnit: one(units, {
    fields: [productVariants.baseUnitId],
    references: [units.id],
  }),
  steelSpecification: one(steelSpecifications, {
    fields: [productVariants.id],
    references: [steelSpecifications.productVariantId],
  }),
  conversions: many(unitConversions),
}));

export const unitConversionsRelations = relations(unitConversions, ({ one }) => ({
  fromUnit: one(units, {
    fields: [unitConversions.fromUnitId],
    references: [units.id],
    relationName: 'fromUnit',
  }),
  toUnit: one(units, {
    fields: [unitConversions.toUnitId],
    references: [units.id],
    relationName: 'toUnit',
  }),
  productVariant: one(productVariants, {
    fields: [unitConversions.productVariantId],
    references: [productVariants.id],
  }),
}));

export const steelSpecificationsRelations = relations(steelSpecifications, ({ one }) => ({
  productVariant: one(productVariants, {
    fields: [steelSpecifications.productVariantId],
    references: [productVariants.id],
  }),
  brand: one(brands, {
    fields: [steelSpecifications.brandId],
    references: [brands.id],
  }),
  purchaseUnit: one(units, {
    fields: [steelSpecifications.purchaseUnitId],
    references: [units.id],
  }),
  saleUnit: one(units, {
    fields: [steelSpecifications.saleUnitId],
    references: [units.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  customer: one(customers, {
    fields: [projects.customerId],
    references: [customers.id],
  }),
}));
