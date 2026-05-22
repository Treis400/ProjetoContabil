import { Router } from 'express';
import * as documentController from '../controllers/document.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';

export const documentsRoutes = Router();

documentsRoutes.use(ensureAuthenticated);
documentsRoutes.get('/', documentController.listDocuments);
documentsRoutes.get('/:id/download', documentController.downloadDocument);
