import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../../lib/http.js';
import { getUserById, loginUser, registerUser } from './auth.service.js';

const COOKIE_NAME = 'token';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.isProduction,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  path: '/',
};

export async function register(req: Request, res: Response): Promise<void> {
  const { user, token } = await registerUser(req.body);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.status(201).json({ user, token });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { user, token } = await loginUser(req.body);
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json({ user, token });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const user = await getUserById(req.user.id);
  res.json({ user });
}
