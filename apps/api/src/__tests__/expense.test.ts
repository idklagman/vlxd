import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { expenseRoutes } from '../routes/expenses/expenses.routes.js';

describe('Expense REST API Contract & Validation Tests', () => {
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

    await app.register(expenseRoutes, { prefix: '/api/expenses' });

    await app.ready();

    authToken = app.jwt.sign({ id: 'test-admin', username: 'admin', role: 'OWNER', tokenVersion: 0 });
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. Auth Guarding
  describe('Authentication Guards', () => {
    it('rejects unauthenticated GET /api/expenses with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/expenses' });
      expect(res.statusCode).toBe(401);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects unauthenticated POST /api/expenses with 401', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/expenses', payload: {} });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated GET /api/expenses/summary with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/expenses/summary' });
      expect(res.statusCode).toBe(401);
    });
  });

  // 2. Request Validation
  describe('Validation on Expense Creation', () => {
    it('rejects expense creation with negative amount', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/expenses',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          amount: -150000, // negative
          expenseDate: '2026-08-23',
          paymentMethod: 'CASH',
        },
      });
      expect(res.statusCode).toBe(400);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects expense creation with invalid date format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/expenses',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          amount: 150000,
          expenseDate: '23-08-2026', // invalid date
          paymentMethod: 'CASH',
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects expense category creation with empty code or name', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/expenses/categories',
        headers: { authorization: `Bearer ${authToken}` },
        payload: {
          code: '',
          name: '',
        },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
