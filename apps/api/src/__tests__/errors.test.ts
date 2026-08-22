import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { registerErrorHandler } from '../plugins/error-handler.js';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ForbiddenError,
  BusinessRuleError,
} from '../utils/errors.js';

describe('Error Handling and Custom Errors', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    registerErrorHandler(app);

    // Routes to trigger various errors
    app.get('/test/validation-zod', async () => {
      const schema = z.object({
        username: z.string().min(1, 'Tên đăng nhập không được để trống'),
      });
      schema.parse({});
    });

    app.get('/test/app-error', async () => {
      throw new AppError(400, 'CUSTOM_CODE', 'Thông báo lỗi tùy chỉnh');
    });

    app.get('/test/auth-error', async () => {
      throw new AuthenticationError();
    });

    app.get('/test/not-found', async () => {
      throw new NotFoundError('khách hàng');
    });

    app.get('/test/forbidden', async () => {
      throw new ForbiddenError();
    });

    app.get('/test/business-rule', async () => {
      throw new BusinessRuleError('Không đủ số lượng D16 trong kho');
    });

    app.get('/test/unknown-error', async () => {
      throw new Error('Unexpected database failure');
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('handles Zod validation errors with Vietnamese messages and field details', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test/validation-zod',
    });

    expect(res.statusCode).toBe(400);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toContain('Tên đăng nhập: Không được để trống');
    expect(json.error.details.username).toBeDefined();
  });

  it('handles AuthenticationError with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test/auth-error',
    });

    expect(res.statusCode).toBe(401);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('AUTHENTICATION_ERROR');
    expect(json.error.message).toBe('Tên đăng nhập hoặc mật khẩu không đúng');
  });

  it('handles NotFoundError with 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test/not-found',
    });

    expect(res.statusCode).toBe(404);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
    expect(json.error.message).toBe('Không tìm thấy khách hàng');
  });

  it('handles ForbiddenError with 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test/forbidden',
    });

    expect(res.statusCode).toBe(403);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
    expect(json.error.message).toBe('Bạn không có quyền thực hiện thao tác này');
  });

  it('handles BusinessRuleError with 422', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test/business-rule',
    });

    expect(res.statusCode).toBe(422);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('BUSINESS_RULE_ERROR');
    expect(json.error.message).toBe('Không đủ số lượng D16 trong kho');
  });

  it('handles unexpected errors with 500 and safe Vietnamese message', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test/unknown-error',
    });

    expect(res.statusCode).toBe(500);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
    expect(json.error.message).toBe('Đã xảy ra lỗi hệ thống trên máy chủ. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.');
  });
});
