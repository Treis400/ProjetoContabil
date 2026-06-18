import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from '../controllers/fiscal-aux.controller.js';
import { ensureAuthenticated, ensureRole } from '../middlewares/auth.middleware.js';

export const fiscalAuxRoutes = Router();

fiscalAuxRoutes.use(ensureAuthenticated);

fiscalAuxRoutes.get('/cfop', controller.listCfop);
fiscalAuxRoutes.post('/cfop', ensureRole([UserRole.ADMIN]), controller.upsertCfop);
fiscalAuxRoutes.delete('/cfop/:id', ensureRole([UserRole.ADMIN]), controller.deleteCfop);

fiscalAuxRoutes.get('/cst', controller.listCst);
fiscalAuxRoutes.post('/cst', ensureRole([UserRole.ADMIN]), controller.upsertCst);

fiscalAuxRoutes.get('/ncm', controller.listNcm);
fiscalAuxRoutes.get('/cest', controller.listCest);

fiscalAuxRoutes.get('/operation-natures', controller.listOperationNatures);
fiscalAuxRoutes.post('/operation-natures', ensureRole([UserRole.ADMIN]), controller.createOperationNature);
fiscalAuxRoutes.put('/operation-natures/:id', ensureRole([UserRole.ADMIN]), controller.updateOperationNature);
fiscalAuxRoutes.delete('/operation-natures/:id', ensureRole([UserRole.ADMIN]), controller.deleteOperationNature);
