import { FastifyInstance } from 'fastify';
import { loginSchema } from './auth.schemas.js';
import { validateCredentials, buildTokenPayload, sanitizeUser, getUserById } from '../../services/auth.service.js';
import { AuthenticationError } from '../../utils/errors.js';
import { createAuditLog } from '../../services/audit.service.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await validateCredentials(body.username, body.password);
    
    const payload = buildTokenPayload(user);
    const accessToken = app.jwt.sign({ ...payload, type: 'access' }, { expiresIn: '15m' });
    const refreshToken = app.jwt.sign({ ...payload, type: 'refresh' }, { expiresIn: '30d' });

    reply.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    await createAuditLog({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'AUTH',
      ipAddress: request.ip
    });

    return {
      success: true,
      data: {
        user: sanitizeUser(user),
        accessToken,
      },
    };
  });

  app.post('/refresh', async (request, reply) => {
    const token = request.cookies.refreshToken;
    if (!token) {
      throw new AuthenticationError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }

    try {
      const decoded = app.jwt.verify<{ id: string; type: string; tokenVersion: number }>(token);
      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Token không hợp lệ.');
      }

      const user = await getUserById(decoded.id);
      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        throw new AuthenticationError('Phiên đăng nhập không hợp lệ hoặc đã bị huỷ.');
      }

      const payload = buildTokenPayload(user);
      const accessToken = app.jwt.sign({ ...payload, type: 'access' }, { expiresIn: '15m' });

      return {
        success: true,
        data: { accessToken },
      };
    } catch (error) {
      throw new AuthenticationError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }
  });

  app.post('/logout', async (request, reply) => {
    reply.clearCookie('refreshToken', { path: '/' });
    return { success: true, data: null };
  });

  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const decoded = request.user as any;
    const user = await getUserById(decoded.id);
    if (!user) {
      throw new AuthenticationError('Người dùng không tồn tại.');
    }
    return {
      success: true,
      data: {
        user: sanitizeUser(user)
      }
    };
  });
}
