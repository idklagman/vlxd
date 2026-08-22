import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { deliveryRoutes } from '../routes/delivery/delivery.routes.js';

describe('Delivery REST API Contract & Validation Tests', () => {
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

    await app.register(deliveryRoutes, { prefix: '/api/deliveries' });

    await app.ready();

    authToken = app.jwt.sign({ id: 'test-admin', username: 'admin', role: 'OWNER', tokenVersion: 0 });
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. Auth Guarding
  describe('Authentication Guards', () => {
    it('rejects unauthenticated GET /api/deliveries with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/deliveries' });
      expect(res.statusCode).toBe(401);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects unauthenticated POST /api/deliveries with 401', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/deliveries', payload: {} });
      expect(res.statusCode).toBe(401);
    });
  });

  // 2. Request Validation
  describe('Validation on Delivery Trip Creation', () => {
    it('rejects delivery creation without items', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/deliveries',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          salesOrderId: '123e4567-e89b-12d3-a456-426614174000',
          deliveryDate: '2026-08-23',
          items: [], // empty items
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects delivery creation with negative quantity item', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/deliveries',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          salesOrderId: '123e4567-e89b-12d3-a456-426614174000',
          deliveryDate: '2026-08-23',
          items: [
            {
              productVariantId: '123e4567-e89b-12d3-a456-426614174001',
              quantity: -5,
              unitId: '123e4567-e89b-12d3-a456-426614174002',
            },
          ],
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects delivery creation with invalid date format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/deliveries',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          salesOrderId: '123e4567-e89b-12d3-a456-426614174000',
          deliveryDate: '23-08-2026', // invalid date format
          items: [
            {
              productVariantId: '123e4567-e89b-12d3-a456-426614174001',
              quantity: 5,
              unitId: '123e4567-e89b-12d3-a456-426614174002',
            },
          ],
        },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
