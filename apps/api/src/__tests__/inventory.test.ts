import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { purchaseRoutes } from '../routes/purchases/purchases.routes.js';
import { inventoryRoutes } from '../routes/inventory/inventory.routes.js';

describe('Purchase & Inventory REST API Contract & Validation Tests', () => {
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

    await app.register(purchaseRoutes, { prefix: '/api/purchases' });
    await app.register(inventoryRoutes, { prefix: '/api/inventory' });

    await app.ready();

    authToken = app.jwt.sign({ id: 'test-admin', username: 'admin', role: 'OWNER', tokenVersion: 0 });
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. Auth Guarding
  describe('Authentication Guards', () => {
    it('rejects unauthenticated GET /api/purchases with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/purchases' });
      expect(res.statusCode).toBe(401);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects unauthenticated GET /api/inventory/balances with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/inventory/balances' });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated GET /api/inventory/transactions with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/inventory/transactions' });
      expect(res.statusCode).toBe(401);
    });
  });

  // 2. Request Validation
  describe('Validation on Purchase & Inventory Endpoints', () => {
    it('rejects purchase creation without items', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/purchases',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          supplierId: '123e4567-e89b-12d3-a456-426614174000',
          warehouseId: '123e4567-e89b-12d3-a456-426614174001',
          purchaseDate: '2026-08-23',
          items: [], // empty items
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects purchase creation with invalid date format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/purchases',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          supplierId: '123e4567-e89b-12d3-a456-426614174000',
          warehouseId: '123e4567-e89b-12d3-a456-426614174001',
          purchaseDate: '23/08/2026', // invalid date
          items: [
            {
              productVariantId: '123e4567-e89b-12d3-a456-426614174002',
              inputQuantity: 10,
              inputUnitId: '123e4567-e89b-12d3-a456-426614174003',
              unitPrice: 15000,
            },
          ],
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects inventory adjustment without reason or with reason < 3 chars', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/inventory/adjustments',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          warehouseId: '123e4567-e89b-12d3-a456-426614174000',
          adjustmentDate: '2026-08-23',
          reason: '  ', // empty reason
          items: [
            {
              productVariantId: '123e4567-e89b-12d3-a456-426614174002',
              newQuantity: 50,
            },
          ],
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects warehouse transfer when fromWarehouse and toWarehouse are identical', async () => {
      const sameWhId = '123e4567-e89b-12d3-a456-426614174000';
      const res = await app.inject({
        method: 'POST',
        url: '/api/inventory/transfers',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          fromWarehouseId: sameWhId,
          toWarehouseId: sameWhId,
          transferDate: '2026-08-23',
          items: [
            {
              productVariantId: '123e4567-e89b-12d3-a456-426614174002',
              quantity: 5,
              unitId: '123e4567-e89b-12d3-a456-426614174003',
            },
          ],
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
