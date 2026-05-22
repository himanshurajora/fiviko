import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import type { UserDTO } from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/http.js';
import { signToken } from '../../lib/jwt.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

const BCRYPT_ROUNDS = 12;

/** Strip the password hash and shape a User row into the public DTO. */
export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    baseCurrency: user.baseCurrency,
    financialPersonality: user.financialPersonality,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function registerUser(input: RegisterInput): Promise<{ user: UserDTO; token: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw AppError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      baseCurrency: input.baseCurrency,
    },
  });

  return { user: toUserDTO(user), token: issueToken(user) };
}

export async function loginUser(input: LoginInput): Promise<{ user: UserDTO; token: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Compare even when the user is missing to reduce timing-based account enumeration.
  const hash = user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const ok = await bcrypt.compare(input.password, hash);
  if (!user || !ok) throw AppError.unauthorized('Invalid email or password');

  return { user: toUserDTO(user), token: issueToken(user) };
}

export async function getUserById(id: string): Promise<UserDTO> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw AppError.notFound('User not found');
  return toUserDTO(user);
}

function issueToken(user: User): string {
  return signToken({ sub: user.id, email: user.email });
}
