import { Request, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { getRequiredString, getOptionalString } from '../utils/request.js';
import * as svc from '../services/tax-apuration.service.js';

export async function listApurations(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.query.clientId, 'clientId');
    const year = req.query.year ? Number(req.query.year) : undefined;
    const data = await svc.listApurations(clientId, year);
    res.json(data);
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro' });
  }
}

export async function getApuration(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    const data = await svc.getApuration(id);
    res.json(data);
  } catch (e: unknown) {
    res.status(404).json({ message: e instanceof Error ? e.message : 'Não encontrado' });
  }
}

export async function createApuration(req: Request, res: Response) {
  try {
    const userId = (req as AuthRequest).user?.id;
    const data = await svc.createApuration({ ...req.body, userId });
    res.status(201).json(data);
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro ao criar' });
  }
}

export async function calcApuration(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    const data = await svc.calcApuration(id);
    res.json(data);
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro ao calcular' });
  }
}

export async function closeApuration(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    const data = await svc.closeApuration(id);
    res.json(data);
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro ao encerrar' });
  }
}

export async function reopenApuration(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    const data = await svc.reopenApuration(id);
    res.json(data);
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro ao reabrir' });
  }
}

export async function deleteApuration(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.id, 'id');
    await svc.deleteApuration(id);
    res.status(204).send();
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro ao excluir' });
  }
}

export async function addAdjustment(req: Request, res: Response) {
  try {
    const apurationId = getRequiredString(req.params.id, 'id');
    const data = await svc.addAdjustment({ ...req.body, apurationId });
    res.status(201).json(data);
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro' });
  }
}

export async function removeAdjustment(req: Request, res: Response) {
  try {
    const id = getRequiredString(req.params.adjustmentId, 'adjustmentId');
    await svc.removeAdjustment(id);
    res.status(204).send();
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro' });
  }
}

export async function upsertSimplesRevenue(req: Request, res: Response) {
  try {
    const apurationId = getRequiredString(req.params.id, 'id');
    const data = await svc.upsertSimplesRevenue({ ...req.body, apurationId });
    res.json(data);
  } catch (e: unknown) {
    res.status(400).json({ message: e instanceof Error ? e.message : 'Erro' });
  }
}
