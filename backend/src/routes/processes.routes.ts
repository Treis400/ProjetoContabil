import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as processController from '../controllers/process.controller.js';
import * as documentController from '../controllers/document.controller.js';
import { ensureAuthenticated, ensureRole } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { uploadRateLimit } from '../middlewares/rate-limit.middleware.js';

export const processesRoutes = Router();

processesRoutes.use(ensureAuthenticated);
processesRoutes.get('/', processController.listProcesses);
processesRoutes.get('/:id', processController.getProcess);
processesRoutes.post('/', ensureRole([UserRole.ADMIN]), processController.createProcess);
processesRoutes.put('/:id', ensureRole([UserRole.ADMIN]), processController.updateProcess);
processesRoutes.patch('/:id/status', processController.updateProcessStatus);
processesRoutes.get('/:id/steps', processController.getProcessSteps);
processesRoutes.post('/:id/steps', processController.createProcessStep);
processesRoutes.patch('/:id/steps/:stepId', processController.updateProcessStep);
processesRoutes.get('/:id/movements', processController.getProcessMovements);
processesRoutes.get('/:id/documents', documentController.listProcessDocuments);
processesRoutes.post(
  '/:id/documents',
  uploadRateLimit,
  upload.single('file'),
  documentController.uploadProcessDocument,
);
