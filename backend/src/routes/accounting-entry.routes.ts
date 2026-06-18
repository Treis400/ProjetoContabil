import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import * as ctrl from '../controllers/accounting-entry.controller.js';

export const accountingEntryRoutes = Router();

accountingEntryRoutes.use(ensureAuthenticated);

accountingEntryRoutes.get('/',              ctrl.listEntries);
accountingEntryRoutes.get('/razao',         ctrl.getLedger);
accountingEntryRoutes.get('/balancete',     ctrl.getTrialBalance);
accountingEntryRoutes.get('/:id',           ctrl.getEntry);
accountingEntryRoutes.post('/',             ctrl.createEntry);
accountingEntryRoutes.put('/:id',           ctrl.updateEntry);
accountingEntryRoutes.post('/:id/estornar', ctrl.reverseEntry);
accountingEntryRoutes.delete('/:id',        ctrl.deleteEntry);
