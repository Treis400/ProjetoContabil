import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import * as ctrl from '../controllers/accounting.controller.js';

const router = Router();
router.use(ensureAuthenticated);

// Plano de Contas
router.get('/plano-contas',           ctrl.listAccounts);
router.post('/plano-contas',          ctrl.createAccount);
router.post('/plano-contas/importar', ctrl.importDefaultPlan);
router.get('/plano-contas/:id',       ctrl.getAccount);
router.put('/plano-contas/:id',       ctrl.updateAccount);
router.delete('/plano-contas/:id',    ctrl.deleteAccount);

// Centros de Custo
router.get('/centros-custo',       ctrl.listCostCenters);
router.post('/centros-custo',      ctrl.createCostCenter);
router.put('/centros-custo/:id',   ctrl.updateCostCenter);
router.delete('/centros-custo/:id', ctrl.deleteCostCenter);

// Históricos Padrão
router.get('/historicos',       ctrl.listStandardHistories);
router.post('/historicos',      ctrl.createStandardHistory);
router.put('/historicos/:id',   ctrl.updateStandardHistory);
router.delete('/historicos/:id', ctrl.deleteStandardHistory);

// Tipos de Lançamento
router.get('/tipos-lancamento',       ctrl.listEntryTypes);
router.post('/tipos-lancamento',      ctrl.createEntryType);
router.put('/tipos-lancamento/:id',   ctrl.updateEntryType);
router.delete('/tipos-lancamento/:id', ctrl.deleteEntryType);

// Parâmetros Contábeis
router.get('/parametros',         ctrl.getParameters);
router.post('/parametros',        ctrl.upsertParameters);
router.post('/parametros/periodo', ctrl.togglePeriod);

export { router as accountingRoutes };
