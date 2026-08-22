import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { reportRoutes } from '../routes/reports/reports.routes.js';

describe('Reports & Analytics REST API Contract Tests', () => {
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

    await app.register(reportRoutes, { prefix: '/api/reports' });

    await app.ready();

    authToken = app.jwt.sign({ id: 'test-admin', username: 'admin', role: 'OWNER', tokenVersion: 0 });
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. Auth Guarding
  describe('Authentication Guards', () => {
    it('rejects unauthenticated GET /api/reports/dashboard with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/reports/dashboard' });
      expect(res.statusCode).toBe(401);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects unauthenticated GET /api/reports/profit with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/reports/profit' });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated GET /api/reports/sales with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/reports/sales' });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated GET /api/reports/inventory-valuation with 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/reports/inventory-valuation' });
      expect(res.statusCode).toBe(401);
    });
  });
});
