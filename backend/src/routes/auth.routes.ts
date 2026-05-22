import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as authController from '../controllers/auth.controller.js';
import { ensureAuthenticated, ensureRole } from '../middlewares/auth.middleware.js';

export const authRoutes = Router();

authRoutes.post('/login', authController.login);
authRoutes.get('/me', ensureAuthenticated, authController.me);
authRoutes.post(
  '/register',
  ensureAuthenticated,
  ensureRole([UserRole.ADMIN]),
  authController.createUser,
);
