import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { debtRoutes } from '../routes/debt/debt.routes.js';
import { paymentRoutes } from '../routes/payments/payments.routes.js';
import { financeRoutes } from '../routes/finance/finance.routes.js';

describe('Debt & Payment REST API Contract & Validation Tests', () => {
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

    await app.register(debtRoutes, { prefix: '/api/debt' });
    await app.register(paymentRoutes, { prefix: '/api/payments' });
    await app.register(financeRoutes, { prefix: '/api/finance' });

    await app.ready();

    authToken = app.jwt.sign({ id: 'test-admin', username: 'admin', role: 'OWNER', tokenVersion: 0 });
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. Auth Guarding
  describe('Authentication Guards', () => {
    it('rejects unauthenticated GET /api/debt/customers with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/debt/customers' });
      expect(res.statusCode).toBe(401);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects unauthenticated GET /api/debt/suppliers with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/debt/suppliers' });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated POST /api/payments/receipt with 401', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/payments/receipt', payload: {} });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated GET /api/finance/cash with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/finance/cash' });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated GET /api/finance/bank with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/finance/bank' });
      expect(res.statusCode).toBe(401);
    });
  });

  // 2. Request Validation
  describe('Validation on Payment Receipts & Spends', () => {
    it('rejects payment receipt creation with negative amount', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/receipt',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: '123e4567-e89b-12d3-a456-426614174000',
          amount: -500000, // negative amount
          paymentDate: '2026-08-23',
          paymentMethod: 'CASH',
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects payment receipt with invalid payment method', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/receipt',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          customerId: '123e4567-e89b-12d3-a456-426614174000',
          amount: 500000,
          paymentDate: '2026-08-23',
          paymentMethod: 'BITCOIN', // invalid method
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects payment spend voucher with invalid date format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/payments/spend',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          amount: 1000000,
          paymentDate: '23/08/2026', // invalid date
          paymentMethod: 'BANK_TRANSFER',
          category: 'CHI_PHI_XANG_DAU',
        },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
