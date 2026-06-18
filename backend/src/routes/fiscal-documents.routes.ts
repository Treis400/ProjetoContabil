import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from '../controllers/fiscal-document.controller.js';
import { ensureAuthenticated, ensureRole } from '../middlewares/auth.middleware.js';

export const fiscalDocumentsRoutes = Router();

fiscalDocumentsRoutes.use(ensureAuthenticated);

fiscalDocumentsRoutes.get('/documents', controller.list);
fiscalDocumentsRoutes.get('/documents/:id', controller.getById);
fiscalDocumentsRoutes.post('/documents', controller.create);
fiscalDocumentsRoutes.post('/documents/import-xml', controller.importXml);
fiscalDocumentsRoutes.patch('/documents/:id/status', ensureRole([UserRole.ADMIN]), controller.updateStatus);
fiscalDocumentsRoutes.post('/documents/:id/revalidate', controller.revalidate);
fiscalDocumentsRoutes.delete('/documents/:id', ensureRole([UserRole.ADMIN]), controller.remove);
