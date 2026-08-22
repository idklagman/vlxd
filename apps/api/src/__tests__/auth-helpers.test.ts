import { describe, it, expect } from 'vitest';
import { sanitizeUser, buildTokenPayload } from '../services/auth.service.js';

describe('Auth Service Helpers', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'admin',
    passwordHash: '$2b$12$eX4mpL3H4shP4ssw0rd',
    fullName: 'Chủ Cửa Hàng',
    phone: '0987654321',
    role: 'OWNER',
    tokenVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('sanitizeUser removes passwordHash and tokenVersion', () => {
    const safe = sanitizeUser(mockUser);
    expect(safe).not.toHaveProperty('passwordHash');
    expect(safe).not.toHaveProperty('tokenVersion');
    expect(safe.username).toBe('admin');
    expect(safe.fullName).toBe('Chủ Cửa Hàng');
  });

  it('buildTokenPayload creates standard payload', () => {
    const payload = buildTokenPayload(mockUser);
    expect(payload).toEqual({
      id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'admin',
      role: 'OWNER',
      tokenVersion: 1,
    });
  });
});
