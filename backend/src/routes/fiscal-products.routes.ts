import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from '../controllers/fiscal-product.controller.js';
import { ensureAuthenticated, ensureRole } from '../middlewares/auth.middleware.js';

export const fiscalProductsRoutes = Router();

fiscalProductsRoutes.use(ensureAuthenticated);

fiscalProductsRoutes.get('/clients/:clientId/fiscal-products', controller.list);
fiscalProductsRoutes.post('/clients/:clientId/fiscal-products', ensureRole([UserRole.ADMIN]), controller.create);
fiscalProductsRoutes.get('/fiscal-products/:id', controller.getById);
fiscalProductsRoutes.put('/fiscal-products/:id', ensureRole([UserRole.ADMIN]), controller.update);
fiscalProductsRoutes.delete('/fiscal-products/:id', ensureRole([UserRole.ADMIN]), controller.remove);
