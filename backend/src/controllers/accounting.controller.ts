import { Request, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { getRequiredString, getOptionalString } from '../utils/request.js';
import * as planSvc from '../services/accounting-plan.service.js';
import * as auxSvc  from '../services/accounting-aux.service.js';

// ── Plano de Contas ───────────────────────────────────────────────────────────

export async function listAccounts(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.query.clientId, 'clientId');
    const classification = getOptionalString(req.query.classification);
    res.json(await planSvc.listAccounts(clientId, classification));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function getAccount(req: Request, res: Response) {
  try {
    res.json(await planSvc.getAccount(getRequiredString(req.params.id, 'id')));
  } catch (e: unknown) { res.status(404).json({ message: (e as Error).message }); }
}

export async function createAccount(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.body.clientId, 'clientId');
    res.status(201).json(await planSvc.createAccount(clientId, req.body));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function updateAccount(req: Request, res: Response) {
  try {
    res.json(await planSvc.updateAccount(getRequiredString(req.params.id, 'id'), req.body));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function deleteAccount(req: Request, res: Response) {
  try {
    await planSvc.deleteAccount(getRequiredString(req.params.id, 'id'));
    res.status(204).send();
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function importDefaultPlan(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.body.clientId, 'clientId');
    const count = await planSvc.importDefaultPlan(clientId);
    res.json({ imported: count });
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

// ── Centros de Custo ──────────────────────────────────────────────────────────

export async function listCostCenters(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.query.clientId, 'clientId');
    res.json(await auxSvc.listCostCenters(clientId));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function createCostCenter(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.body.clientId, 'clientId');
    res.status(201).json(await auxSvc.createCostCenter(clientId, req.body));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function updateCostCenter(req: Request, res: Response) {
  try {
    res.json(await auxSvc.updateCostCenter(getRequiredString(req.params.id, 'id'), req.body));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function deleteCostCenter(req: Request, res: Response) {
  try {
    await auxSvc.deleteCostCenter(getRequiredString(req.params.id, 'id'));
    res.status(204).send();
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

// ── Históricos Padrão ─────────────────────────────────────────────────────────

export async function listStandardHistories(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.query.clientId, 'clientId');
    const search = getOptionalString(req.query.search);
    res.json(await auxSvc.listStandardHistories(clientId, search));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function createStandardHistory(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.body.clientId, 'clientId');
    res.status(201).json(await auxSvc.createStandardHistory(clientId, req.body));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function updateStandardHistory(req: Request, res: Response) {
  try {
    res.json(await auxSvc.updateStandardHistory(getRequiredString(req.params.id, 'id'), req.body));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function deleteStandardHistory(req: Request, res: Response) {
  try {
    await auxSvc.deleteStandardHistory(getRequiredString(req.params.id, 'id'));
    res.status(204).send();
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

// ── Tipos de Lançamento ───────────────────────────────────────────────────────

export async function listEntryTypes(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.query.clientId, 'clientId');
    res.json(await auxSvc.listEntryTypes(clientId));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function createEntryType(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.body.clientId, 'clientId');
    res.status(201).json(await auxSvc.createEntryType(clientId, req.body));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function updateEntryType(req: Request, res: Response) {
  try {
    res.json(await auxSvc.updateEntryType(getRequiredString(req.params.id, 'id'), req.body));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function deleteEntryType(req: Request, res: Response) {
  try {
    await auxSvc.deleteEntryType(getRequiredString(req.params.id, 'id'));
    res.status(204).send();
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

// ── Parâmetros Contábeis ──────────────────────────────────────────────────────

export async function getParameters(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.query.clientId, 'clientId');
    res.json(await auxSvc.getParameters(clientId));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function upsertParameters(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.body.clientId, 'clientId');
    res.json(await auxSvc.upsertParameters(clientId, req.body));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function togglePeriod(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.body.clientId, 'clientId');
    const period   = getRequiredString(req.body.period, 'period');
    res.json(await auxSvc.togglePeriod(clientId, period));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}
