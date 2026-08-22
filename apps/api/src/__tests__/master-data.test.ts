import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { categoryRoutes } from '../routes/categories/categories.routes.js';
import { brandRoutes } from '../routes/brands/brands.routes.js';
import { unitRoutes } from '../routes/units/units.routes.js';
import { warehouseRoutes } from '../routes/warehouses/warehouses.routes.js';
import { supplierRoutes } from '../routes/suppliers/suppliers.routes.js';
import { vehicleRoutes } from '../routes/vehicles/vehicles.routes.js';
import { driverRoutes } from '../routes/drivers/drivers.routes.js';
import { customerRoutes } from '../routes/customers/customers.routes.js';
import { projectRoutes } from '../routes/projects/projects.routes.js';
import { steelSpecRoutes } from '../routes/steel-specs/steel-specs.routes.js';

describe('Master Data REST API Contract & Validation Tests', () => {
  let app: FastifyInstance;
  let authToken: string;

  beforeAll(async () => {
    app = Fastify();
    await app.register(cors);
    await app.register(cookie);
    await app.register(jwt, { secret: 'test-secret-key-123456789' });

    registerErrorHandler(app);

    app.decorate('authenticate', async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
      } catch {
        reply.status(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' },
        });
      }
    });

    await app.register(categoryRoutes, { prefix: '/api/categories' });
    await app.register(brandRoutes, { prefix: '/api/brands' });
    await app.register(unitRoutes, { prefix: '/api/units' });
    await app.register(steelSpecRoutes, { prefix: '/api/steel-specs' });
    await app.register(warehouseRoutes, { prefix: '/api/warehouses' });
    await app.register(supplierRoutes, { prefix: '/api/suppliers' });
    await app.register(vehicleRoutes, { prefix: '/api/vehicles' });
    await app.register(driverRoutes, { prefix: '/api/drivers' });
    await app.register(customerRoutes, { prefix: '/api/customers' });
    await app.register(projectRoutes, { prefix: '/api/projects' });

    await app.ready();

    authToken = app.jwt.sign({ id: 'test-admin', username: 'admin', role: 'OWNER', tokenVersion: 0 });
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. Auth Guarding
  describe('Authentication Guards', () => {
    it('rejects unauthenticated GET /api/categories with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/categories' });
      expect(res.statusCode).toBe(401);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects unauthenticated GET /api/customers with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/customers' });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated GET /api/steel-specs with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/steel-specs' });
      expect(res.statusCode).toBe(401);
    });
  });

  // 2. Request Validation
  describe('Validation on POST Endpoints', () => {
    it('rejects category creation with empty name', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/categories',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: '', sortOrder: 0 },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(json.error.details.name).toBeDefined();
    });

    it('rejects brand creation with empty name', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/brands',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: '   ' },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects unit creation with empty code', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/units',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { code: '', name: 'Kilôgam' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects unit conversion where fromUnit and toUnit are identical', async () => {
      const sameId = '123e4567-e89b-12d3-a456-426614174000';
      const res = await app.inject({
        method: 'POST',
        url: '/api/units/conversions',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          fromUnitId: sameId,
          toUnitId: sameId,
          conversionRate: 1,
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.error.code).toBe('VALIDATION_ERROR');
      expect(json.error.message).toBe('Dữ liệu không hợp lệ');
    });

    it('rejects customer creation with invalid Vietnamese phone number', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/customers',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          name: 'Khách hàng test',
          phone: '12345', // invalid phone
          customerType: 'RETAIL',
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.error.details.phone).toBeDefined();
    });

    it('rejects steel spec creation with invalid steelType', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/steel-specs',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          productVariantId: '123e4567-e89b-12d3-a456-426614174000',
          brandId: '123e4567-e89b-12d3-a456-426614174001',
          steelType: 'INVALID_TYPE',
          diameter: 16,
          weightPerMeter: 1.58,
          purchaseUnitId: '123e4567-e89b-12d3-a456-426614174002',
          saleUnitId: '123e4567-e89b-12d3-a456-426614174003',
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
