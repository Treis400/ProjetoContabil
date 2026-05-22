import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as authController from '../controllers/auth.controller.js';
import { ensureAuthenticated, ensureRole } from '../middlewares/auth.middleware.js';

export const usersRoutes = Router();

usersRoutes.use(ensureAuthenticated, ensureRole([UserRole.ADMIN]));
usersRoutes.get('/', authController.listUsers);
usersRoutes.post('/', authController.createUser);
usersRoutes.patch('/:id/status', authController.toggleUserStatus);
