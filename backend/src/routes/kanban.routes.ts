import { Router } from 'express';
import * as processController from '../controllers/process.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';

export const kanbanRoutes = Router();

kanbanRoutes.use(ensureAuthenticated);
kanbanRoutes.get('/processes', processController.getKanban);
