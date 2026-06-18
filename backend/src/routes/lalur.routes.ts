import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import * as ctrl from '../controllers/lalur.controller.js';

const router = Router();
router.use(ensureAuthenticated);

// Tipos de ajuste
router.get('/tipos-ajuste',             ctrl.listAdjustTypes);
router.post('/tipos-ajuste',            ctrl.createAdjustType);
router.put('/tipos-ajuste/:id',         ctrl.updateAdjustType);
router.delete('/tipos-ajuste/:id',      ctrl.deleteAdjustType);

// Regras de integração contábil
router.get('/regras-contabil',          ctrl.listAccountingRules);
router.post('/regras-contabil',         ctrl.createAccountingRule);
router.put('/regras-contabil/:id',      ctrl.updateAccountingRule);
router.delete('/regras-contabil/:id',   ctrl.deleteAccountingRule);

// Períodos
router.get('/periodos',                 ctrl.listPeriods);
router.get('/periodos/:year',           ctrl.getPeriod);
router.put('/periodos/:year',           ctrl.upsertPeriod);
router.post('/periodos/:year/encerrar', ctrl.lockPeriod);
router.post('/periodos/:year/reabrir',  ctrl.unlockPeriod);

// Integração contábil
router.post('/periodos/:year/importar-contabilidade', ctrl.importAccountingResult);
router.get('/periodos/:periodId/importacoes',          ctrl.listAccountingImports);

// Parte A
router.get('/periodos/:periodId/parte-a',      ctrl.listPartA);
router.post('/periodos/:periodId/parte-a',     ctrl.createPartA);
router.put('/parte-a/:id',                      ctrl.updatePartA);
router.delete('/parte-a/:id',                   ctrl.deletePartA);

// Parte B
router.get('/periodos/:periodId/parte-b',      ctrl.listPartB);
router.post('/periodos/:periodId/parte-b',     ctrl.createPartB);
router.put('/parte-b/:id',                      ctrl.updatePartB);
router.delete('/parte-b/:id',                   ctrl.deletePartB);

// Movimentações da Parte B
router.get('/parte-b/:balanceId/movimentos',   ctrl.listPartBMovements);
router.post('/parte-b/:balanceId/movimentos',  ctrl.createPartBMovement);

// Compensações
router.get('/compensacoes',                         ctrl.listCompensations);
router.post('/periodos/:periodId/compensacoes',     ctrl.createCompensation);
router.get('/periodos/:year/limite-compensacao',    ctrl.calcCompensationLimit);
router.post('/periodos/:year/aplicar-compensacao',  ctrl.applyCompensation);

// IRPJ/CSLL
router.post('/periodos/:periodId/irpj-csll',   ctrl.calcIrpjCsll);

// ECF
router.get('/ecf',                             ctrl.listEcf);
router.post('/ecf/:year/gerar',                ctrl.generateEcf);
router.get('/ecf/:year/download',              ctrl.downloadEcf);

// Audit Log
router.get('/auditoria',                       ctrl.listAuditLogs);

export { router as lalurRoutes };
