import type { Request, Response } from 'express';
import * as svc from '../services/patrimony.service.js';

const cid = (req: Request): string => String((req.query as any).clientId ?? '');
const pm = (req: Request) => req.params as Record<string, string>;

// ── Grupos ────────────────────────────────────────────────────────────────────
export async function listGroups(req: Request, res: Response) { res.json(await svc.listGroups(cid(req))); }
export async function createGroup(req: Request, res: Response) { res.status(201).json(await svc.createGroup(cid(req), req.body)); }
export async function updateGroup(req: Request, res: Response) { res.json(await svc.updateGroup(pm(req).id, req.body)); }
export async function deleteGroup(req: Request, res: Response) { await svc.deleteGroup(pm(req).id); res.status(204).send(); }

// ── Localizações ──────────────────────────────────────────────────────────────
export async function listLocations(req: Request, res: Response) { res.json(await svc.listLocations(cid(req))); }
export async function createLocation(req: Request, res: Response) { res.status(201).json(await svc.createLocation(cid(req), req.body)); }
export async function updateLocation(req: Request, res: Response) { res.json(await svc.updateLocation(pm(req).id, req.body)); }
export async function deleteLocation(req: Request, res: Response) { await svc.deleteLocation(pm(req).id); res.status(204).send(); }

// ── Responsáveis ──────────────────────────────────────────────────────────────
export async function listResponsibles(req: Request, res: Response) { res.json(await svc.listResponsibles(cid(req))); }
export async function createResponsible(req: Request, res: Response) { res.status(201).json(await svc.createResponsible(cid(req), req.body)); }
export async function updateResponsible(req: Request, res: Response) { res.json(await svc.updateResponsible(pm(req).id, req.body)); }
export async function deleteResponsible(req: Request, res: Response) { await svc.deleteResponsible(pm(req).id); res.status(204).send(); }

// ── Bens ──────────────────────────────────────────────────────────────────────
export async function listAssets(req: Request, res: Response) {
  const { groupId, locationId, status, responsibleId } = req.query as any;
  res.json(await svc.listAssets(cid(req), { groupId, locationId, status, responsibleId }));
}
export async function getAsset(req: Request, res: Response) { res.json(await svc.getAsset(pm(req).id)); }
export async function createAsset(req: Request, res: Response) {
  const data = { ...req.body, acquisitionDate: new Date(req.body.acquisitionDate) };
  res.status(201).json(await svc.createAsset(cid(req), data));
}
export async function updateAsset(req: Request, res: Response) {
  const data = req.body.acquisitionDate ? { ...req.body, acquisitionDate: new Date(req.body.acquisitionDate) } : req.body;
  res.json(await svc.updateAsset(pm(req).id, data));
}

// ── Movimentação ──────────────────────────────────────────────────────────────
export async function createMovement(req: Request, res: Response) {
  const data = { ...req.body, movementDate: new Date(req.body.movementDate) };
  res.status(201).json(await svc.createMovement(pm(req).assetId, data));
}

// ── Depreciação ───────────────────────────────────────────────────────────────
export async function calcDepreciation(req: Request, res: Response) {
  const { periodMonth, periodYear } = req.body;
  res.json(await svc.calcDepreciation(cid(req), Number(periodMonth), Number(periodYear)));
}
export async function getDepreciationSummary(req: Request, res: Response) {
  const { periodMonth, periodYear } = req.query as any;
  res.json(await svc.getDepreciationSummary(cid(req), Number(periodMonth), Number(periodYear)));
}

// ── Reavaliação ───────────────────────────────────────────────────────────────
export async function createRevaluation(req: Request, res: Response) {
  const data = { ...req.body, revaluationDate: new Date(req.body.revaluationDate) };
  res.status(201).json(await svc.createRevaluation(pm(req).assetId, data));
}

// ── Baixa ─────────────────────────────────────────────────────────────────────
export async function createDisposal(req: Request, res: Response) {
  const data = { ...req.body, disposalDate: new Date(req.body.disposalDate) };
  res.status(201).json(await svc.createDisposal(pm(req).assetId, data));
}

// ── Inventário ────────────────────────────────────────────────────────────────
export async function listInventories(req: Request, res: Response) { res.json(await svc.listInventories(cid(req))); }
export async function createInventory(req: Request, res: Response) {
  const data = { ...req.body, startDate: new Date(req.body.startDate) };
  res.status(201).json(await svc.createInventory(cid(req), data));
}
export async function getInventory(req: Request, res: Response) { res.json(await svc.getInventory(pm(req).id)); }
export async function updateInventoryItem(req: Request, res: Response) { res.json(await svc.updateInventoryItem(pm(req).itemId, req.body)); }
export async function closeInventory(req: Request, res: Response) { res.json(await svc.closeInventory(pm(req).id)); }

// ── Encerramento ──────────────────────────────────────────────────────────────
export async function listPeriodClosings(req: Request, res: Response) { res.json(await svc.listPeriodClosings(cid(req))); }
export async function closePeriod(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { periodMonth, periodYear } = req.body;
  res.json(await svc.closePeriod(cid(req), Number(periodMonth), Number(periodYear), userId));
}
export async function reopenPeriod(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { periodMonth, periodYear, reason } = req.body;
  res.json(await svc.reopenPeriod(cid(req), Number(periodMonth), Number(periodYear), userId, reason));
}
