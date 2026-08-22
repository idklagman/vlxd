import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { salesRoutes } from '../routes/sales/sales.routes.js';

describe('Sales REST API Contract & Validation Tests', () => {
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

    await app.register(salesRoutes, { prefix: '/api/sales' });

    await app.ready();

    authToken = app.jwt.sign({ id: 'test-admin', username: 'admin', role: 'OWNER', tokenVersion: 0 });
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. Auth Guarding
  describe('Authentication Guards', () => {
    it('rejects unauthenticated GET /api/sales/orders with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/sales/orders' });
      expect(res.statusCode).toBe(401);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects unauthenticated POST /api/sales/orders with 401', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/sales/orders', payload: {} });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated GET /api/sales/pricing/last-sold with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/sales/pricing/last-sold' });
      expect(res.statusCode).toBe(401);
    });
  });

  // 2. Request Validation
  describe('Validation on Sales Order Creation', () => {
    it('rejects sales order creation without items', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/sales/orders',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: '123e4567-e89b-12d3-a456-426614174000',
          warehouseId: '123e4567-e89b-12d3-a456-426614174001',
          orderDate: '2026-08-23',
          items: [], // empty items
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects sales order creation with negative quantity', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/sales/orders',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: '123e4567-e89b-12d3-a456-426614174000',
          warehouseId: '123e4567-e89b-12d3-a456-426614174001',
          orderDate: '2026-08-23',
          items: [
            {
              productVariantId: '123e4567-e89b-12d3-a456-426614174002',
              inputQuantity: -10, // negative quantity
              inputUnitId: '123e4567-e89b-12d3-a456-426614174003',
              unitPrice: 15000,
            },
          ],
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects sales order creation with invalid date format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/sales/orders',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: '123e4567-e89b-12d3-a456-426614174000',
          warehouseId: '123e4567-e89b-12d3-a456-426614174001',
          orderDate: '23-08-2026', // invalid date format
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

    it('returns null when querying last sold price without customer or variant query params', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/sales/pricing/last-sold',
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data).toBeNull();
    });
  });
});
