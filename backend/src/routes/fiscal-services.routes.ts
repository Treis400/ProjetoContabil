import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from '../controllers/fiscal-service.controller.js';
import { ensureAuthenticated, ensureRole } from '../middlewares/auth.middleware.js';

export const fiscalServicesRoutes = Router();

fiscalServicesRoutes.use(ensureAuthenticated);

fiscalServicesRoutes.get('/clients/:clientId/fiscal-services', controller.list);
fiscalServicesRoutes.post('/clients/:clientId/fiscal-services', ensureRole([UserRole.ADMIN]), controller.create);
fiscalServicesRoutes.get('/fiscal-services/:id', controller.getById);
fiscalServicesRoutes.put('/fiscal-services/:id', ensureRole([UserRole.ADMIN]), controller.update);
fiscalServicesRoutes.delete('/fiscal-services/:id', ensureRole([UserRole.ADMIN]), controller.remove);
