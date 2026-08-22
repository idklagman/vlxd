import bcrypt from 'bcrypt';
import { db, users, eq } from '@vlxd/db';
import { AuthenticationError } from '../utils/errors.js';

const SALT_ROUNDS = 12;

export interface TokenPayload {
  id: string;
  username: string;
  role: string;
  tokenVersion: number;
}

export async function validateCredentials(username: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    throw new AuthenticationError();
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError();
  }

  return user;
}

export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function incrementTokenVersion(userId: string) {
  const user = await getUserById(userId);
  if (!user) return;
  await db
    .update(users)
    .set({ tokenVersion: user.tokenVersion + 1 })
    .where(eq(users.id, userId));
}

export function buildTokenPayload(user: typeof users.$inferSelect): TokenPayload {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    tokenVersion: user.tokenVersion,
  };
}

export function sanitizeUser(user: typeof users.$inferSelect) {
  const { passwordHash, tokenVersion, ...safeUser } = user;
  return safeUser;
}
