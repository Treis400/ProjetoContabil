import { Request, Response } from 'express';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { getRequiredString, getOptionalString } from '../utils/request.js';
import * as svc from '../services/accounting-entry.service.js';

export async function listEntries(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.query.clientId, 'clientId');
    const result = await svc.listEntries({
      clientId,
      periodMonth: req.query.periodMonth ? Number(req.query.periodMonth) : undefined,
      periodYear:  req.query.periodYear  ? Number(req.query.periodYear)  : undefined,
      status:      getOptionalString(req.query.status) as svc.ListEntriesFilter['status'],
      accountId:   getOptionalString(req.query.accountId),
      dateFrom:    getOptionalString(req.query.dateFrom),
      dateTo:      getOptionalString(req.query.dateTo),
      search:      getOptionalString(req.query.search),
      page:        req.query.page  ? Number(req.query.page)  : 1,
      limit:       req.query.limit ? Number(req.query.limit) : 50,
    });
    res.json(result);
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function getEntry(req: Request, res: Response) {
  try {
    res.json(await svc.getEntry(getRequiredString(req.params.id, 'id')));
  } catch (e: unknown) { res.status(404).json({ message: (e as Error).message }); }
}

export async function createEntry(req: Request, res: Response) {
  try {
    const userId = (req as AuthRequest).user?.id;
    res.status(201).json(await svc.createEntry(req.body, userId));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function updateEntry(req: Request, res: Response) {
  try {
    res.json(await svc.updateEntry(getRequiredString(req.params.id, 'id'), req.body));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function reverseEntry(req: Request, res: Response) {
  try {
    const userId = (req as AuthRequest).user?.id;
    res.status(201).json(await svc.reverseEntry(getRequiredString(req.params.id, 'id'), userId));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function deleteEntry(req: Request, res: Response) {
  try {
    await svc.deleteEntry(getRequiredString(req.params.id, 'id'));
    res.status(204).send();
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function getLedger(req: Request, res: Response) {
  try {
    const clientId  = getRequiredString(req.query.clientId,  'clientId');
    const accountId = getRequiredString(req.query.accountId, 'accountId');
    res.json(await svc.getLedger(
      clientId,
      accountId,
      req.query.periodMonth ? Number(req.query.periodMonth) : undefined,
      req.query.periodYear  ? Number(req.query.periodYear)  : undefined,
    ));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}

export async function getTrialBalance(req: Request, res: Response) {
  try {
    const clientId = getRequiredString(req.query.clientId, 'clientId');
    res.json(await svc.getTrialBalance(
      clientId,
      req.query.periodMonth ? Number(req.query.periodMonth) : undefined,
      req.query.periodYear  ? Number(req.query.periodYear)  : undefined,
    ));
  } catch (e: unknown) { res.status(400).json({ message: (e as Error).message }); }
}
