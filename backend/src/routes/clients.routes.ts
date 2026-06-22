import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as clientController from '../controllers/client.controller.js';
import * as documentController from '../controllers/document.controller.js';
import { ensureAuthenticated, ensureRole } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { uploadRateLimit } from '../middlewares/rate-limit.middleware.js';

export const clientsRoutes = Router();

clientsRoutes.use(ensureAuthenticated);
clientsRoutes.get('/', clientController.listClients);
clientsRoutes.get('/:id', clientController.getClient);
clientsRoutes.post('/', ensureRole([UserRole.ADMIN]), clientController.createClient);
clientsRoutes.put('/:id', ensureRole([UserRole.ADMIN]), clientController.updateClient);
clientsRoutes.delete('/:id', ensureRole([UserRole.ADMIN]), clientController.deleteClient);
clientsRoutes.get('/:id/change-log', clientController.getClientChangeLog);
clientsRoutes.get('/:id/documents', documentController.listClientDocuments);
clientsRoutes.post(
  '/:id/documents',
  uploadRateLimit,
  upload.single('file'),
  documentController.uploadClientDocument,
);
