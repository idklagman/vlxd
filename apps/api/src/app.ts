import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { registerErrorHandler } from './plugins/error-handler.js';
import { authRoutes } from './routes/auth/auth.routes.js';
import { settingsRoutes } from './routes/settings/settings.routes.js';
import { healthRoutes } from './routes/health.js';
import { categoryRoutes } from './routes/categories/categories.routes.js';
import { brandRoutes } from './routes/brands/brands.routes.js';
import { unitRoutes } from './routes/units/units.routes.js';
import { productRoutes } from './routes/products/products.routes.js';
import { steelSpecRoutes } from './routes/steel-specs/steel-specs.routes.js';
import { warehouseRoutes } from './routes/warehouses/warehouses.routes.js';
import { customerRoutes } from './routes/customers/customers.routes.js';
import { projectRoutes } from './routes/projects/projects.routes.js';
import { supplierRoutes } from './routes/suppliers/suppliers.routes.js';
import { vehicleRoutes } from './routes/vehicles/vehicles.routes.js';
import { driverRoutes } from './routes/drivers/drivers.routes.js';
import { purchaseRoutes } from './routes/purchases/purchases.routes.js';
import { inventoryRoutes } from './routes/inventory/inventory.routes.js';
import { salesRoutes } from './routes/sales/sales.routes.js';
import { debtRoutes } from './routes/debt/debt.routes.js';
import { paymentRoutes } from './routes/payments/payments.routes.js';
import { financeRoutes } from './routes/finance/finance.routes.js';
import { deliveryRoutes } from './routes/delivery/delivery.routes.js';
import { expenseRoutes } from './routes/expenses/expenses.routes.js';
import { reportRoutes } from './routes/reports/reports.routes.js';
import { authenticate } from './middleware/authenticate.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Register CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Register cookie support
  await app.register(cookie);

  // Register JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  });

  // Register global error handler
  registerErrorHandler(app);

  // Add authenticate decorator
  app.decorate('authenticate', authenticate);

  // Register routes
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });
  await app.register(categoryRoutes, { prefix: '/api/categories' });
  await app.register(brandRoutes, { prefix: '/api/brands' });
  await app.register(unitRoutes, { prefix: '/api/units' });
  await app.register(productRoutes, { prefix: '/api/products' });
  await app.register(steelSpecRoutes, { prefix: '/api/steel-specs' });
  await app.register(warehouseRoutes, { prefix: '/api/warehouses' });
  await app.register(customerRoutes, { prefix: '/api/customers' });
  await app.register(projectRoutes, { prefix: '/api/projects' });
  await app.register(supplierRoutes, { prefix: '/api/suppliers' });
  await app.register(vehicleRoutes, { prefix: '/api/vehicles' });
  await app.register(driverRoutes, { prefix: '/api/drivers' });
  await app.register(purchaseRoutes, { prefix: '/api/purchases' });
  await app.register(inventoryRoutes, { prefix: '/api/inventory' });
  await app.register(salesRoutes, { prefix: '/api/sales' });
  await app.register(debtRoutes, { prefix: '/api/debt' });
  await app.register(paymentRoutes, { prefix: '/api/payments' });
  await app.register(financeRoutes, { prefix: '/api/finance' });
  await app.register(deliveryRoutes, { prefix: '/api/deliveries' });
  await app.register(expenseRoutes, { prefix: '/api/expenses' });
  await app.register(reportRoutes, { prefix: '/api/reports' });

  return app;
}

