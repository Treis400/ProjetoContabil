import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import * as ctrl from '../controllers/fiscal-obligation.controller.js';

const router = Router();
router.use(ensureAuthenticated);

// Obrigações acessórias
router.get('/obrigacoes', ctrl.listObligations);
router.post('/obrigacoes', ctrl.createObligation);
router.post('/obrigacoes/:id/gerar', ctrl.generateObligation);
router.get('/obrigacoes/:id/download', ctrl.downloadObligation);
router.post('/obrigacoes/:id/transmitir', ctrl.markTransmitted);
router.post('/obrigacoes/:id/dispensar', ctrl.markDispensed);
router.delete('/obrigacoes/:id', ctrl.deleteObligation);

// Livros fiscais
router.get('/livros', ctrl.listBooks);
router.post('/livros', ctrl.generateBook);
router.get('/livros/:id/download', ctrl.downloadBook);
router.delete('/livros/:id', ctrl.deleteBook);

export { router as fiscalObligationRoutes };
