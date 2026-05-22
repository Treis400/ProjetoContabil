import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';

export const dashboardRoutes = Router();

dashboardRoutes.use(ensureAuthenticated);
dashboardRoutes.get('/summary', dashboardController.summary);
