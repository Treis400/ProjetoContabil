import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import * as ctrl from '../controllers/patrimony.controller.js';

const router = Router();
router.use(ensureAuthenticated);

// Cadastros
router.get('/grupos',           ctrl.listGroups);
router.post('/grupos',          ctrl.createGroup);
router.put('/grupos/:id',       ctrl.updateGroup);
router.delete('/grupos/:id',    ctrl.deleteGroup);

router.get('/localizacoes',           ctrl.listLocations);
router.post('/localizacoes',          ctrl.createLocation);
router.put('/localizacoes/:id',       ctrl.updateLocation);
router.delete('/localizacoes/:id',    ctrl.deleteLocation);

router.get('/responsaveis',           ctrl.listResponsibles);
router.post('/responsaveis',          ctrl.createResponsible);
router.put('/responsaveis/:id',       ctrl.updateResponsible);
router.delete('/responsaveis/:id',    ctrl.deleteResponsible);

// Bens
router.get('/bens',          ctrl.listAssets);
router.post('/bens',         ctrl.createAsset);
router.get('/bens/:id',      ctrl.getAsset);
router.put('/bens/:id',      ctrl.updateAsset);

// Movimentação
router.post('/bens/:assetId/movimentacoes', ctrl.createMovement);

// Depreciação
router.post('/depreciacao/calcular',   ctrl.calcDepreciation);
router.get('/depreciacao/resumo',      ctrl.getDepreciationSummary);

// Reavaliação
router.post('/bens/:assetId/reavaliacao', ctrl.createRevaluation);

// Baixa
router.post('/bens/:assetId/baixa',   ctrl.createDisposal);

// Inventário
router.get('/inventarios',            ctrl.listInventories);
router.post('/inventarios',           ctrl.createInventory);
router.get('/inventarios/:id',        ctrl.getInventory);
router.post('/inventarios/:id/fechar', ctrl.closeInventory);
router.put('/inventarios/:id/itens/:itemId', ctrl.updateInventoryItem);

// Encerramento de período
router.get('/encerramento',          ctrl.listPeriodClosings);
router.post('/encerramento/fechar',  ctrl.closePeriod);
router.post('/encerramento/reabrir', ctrl.reopenPeriod);

export { router as patrimonyRoutes };
