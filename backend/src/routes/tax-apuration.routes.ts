import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import * as ctrl from '../controllers/tax-apuration.controller.js';

const router = Router();

router.use(ensureAuthenticated);

router.get('/apuracoes', ctrl.listApurations);
router.post('/apuracoes', ctrl.createApuration);
router.get('/apuracoes/:id', ctrl.getApuration);
router.delete('/apuracoes/:id', ctrl.deleteApuration);
router.post('/apuracoes/:id/calcular', ctrl.calcApuration);
router.post('/apuracoes/:id/encerrar', ctrl.closeApuration);
router.post('/apuracoes/:id/reabrir', ctrl.reopenApuration);
router.post('/apuracoes/:id/ajustes', ctrl.addAdjustment);
router.delete('/apuracoes/:id/ajustes/:adjustmentId', ctrl.removeAdjustment);
router.put('/apuracoes/:id/receitas-simples', ctrl.upsertSimplesRevenue);

export { router as taxApurationRoutes };
