import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { validateBody } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginSchema, registerSchema } from './auth.schema.js';
import { deleteAccount, login, logout, me, register } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), asyncHandler(register));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(login));
authRouter.post('/logout', asyncHandler(logout));
authRouter.get('/me', requireAuth, asyncHandler(me));
authRouter.delete('/me', requireAuth, asyncHandler(deleteAccount));
