import { Router } from 'express';
import * as alertController from '../controllers/alert.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';

export const alertsRoutes = Router();

alertsRoutes.use(ensureAuthenticated);
alertsRoutes.get('/', alertController.listAlerts);
alertsRoutes.patch('/:id/resolve', alertController.resolveAlert);
