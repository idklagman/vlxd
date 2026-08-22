// Customer types
export const CustomerType = {
  RETAIL: 'RETAIL',
  BUILDER: 'BUILDER',
  CONTRACTOR_TEAM: 'CONTRACTOR_TEAM',
  OTHER: 'OTHER',
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

// Order status
export const OrderStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  DELIVERING: 'DELIVERING',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// Purchase status
export const PurchaseStatus = {
  DRAFT: 'DRAFT',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;
export type PurchaseStatus = (typeof PurchaseStatus)[keyof typeof PurchaseStatus];

// Project status
export const ProjectStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

// Delivery status
export const DeliveryStatus = {
  PENDING: 'PENDING',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

// Payment method
export const PaymentMethod = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

// Inventory transaction type
export const InventoryTransactionType = {
  PURCHASE_IN: 'PURCHASE_IN',
  SALE_OUT: 'SALE_OUT',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  REVERSAL: 'REVERSAL',
} as const;
export type InventoryTransactionType = (typeof InventoryTransactionType)[keyof typeof InventoryTransactionType];

// Inventory reference type
export const InventoryReferenceType = {
  PURCHASE: 'PURCHASE',
  SALES_ORDER: 'SALES_ORDER',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER: 'TRANSFER',
} as const;
export type InventoryReferenceType = (typeof InventoryReferenceType)[keyof typeof InventoryReferenceType];


// Steel type
export const SteelType = {
  BAR: 'BAR',
  COIL: 'COIL',
} as const;
export type SteelType = (typeof SteelType)[keyof typeof SteelType];

// Price type
export const PriceType = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
} as const;
export type PriceType = (typeof PriceType)[keyof typeof PriceType];

// Cash flow type
export const CashFlowType = {
  IN: 'IN',
  OUT: 'OUT',
} as const;
export type CashFlowType = (typeof CashFlowType)[keyof typeof CashFlowType];

// Audit action
export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  CANCEL: 'CANCEL',
  PAYMENT: 'PAYMENT',
  INVENTORY_ADJUSTMENT: 'INVENTORY_ADJUSTMENT',
  PRICE_CHANGE: 'PRICE_CHANGE',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
