import type { Request, Response } from 'express';
import { FiscalEntryExit } from '@prisma/client';
import { getOptionalString, getRequiredString } from '../utils/request.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import * as service from '../services/fiscal-document.service.js';

export async function list(req: Request, res: Response) {
  const clientId = getRequiredString(req.query.clientId, 'clientId');
  const data = await service.listFiscalDocuments({
    clientId,
    entryExit: getOptionalString(req.query.entryExit) as FiscalEntryExit | undefined,
    documentType: getOptionalString(req.query.documentType),
    status: getOptionalString(req.query.status),
    periodYear: req.query.periodYear ? Number(req.query.periodYear) : undefined,
    periodMonth: req.query.periodMonth ? Number(req.query.periodMonth) : undefined,
    search: getOptionalString(req.query.search),
  });
  res.json(data);
}

export async function getById(req: Request, res: Response) {
  const id = getRequiredString(req.params.id, 'id');
  const data = await service.getFiscalDocumentById(id);
  res.json(data);
}

export async function create(req: Request, res: Response) {
  const userId = (req as AuthRequest).user?.id ?? '';
  const data = await service.createFiscalDocument(req.body, userId);
  res.status(201).json(data);
}

export async function importXml(req: Request, res: Response) {
  const userId = (req as AuthRequest).user?.id;
  if (!userId) { res.status(401).json({ message: 'Não autenticado.' }); return; }

  const body = req.body as { clientId?: string; entryExit?: FiscalEntryExit; xmlContent?: string };
  if (!body.clientId || !body.entryExit || !body.xmlContent) {
    res.status(400).json({ message: 'clientId, entryExit e xmlContent são obrigatórios.' });
    return;
  }

  const data = await service.importFiscalDocumentFromXml(body.clientId, body.xmlContent, body.entryExit, userId);
  res.status(201).json(data);
}

export async function updateStatus(req: Request, res: Response) {
  const id = getRequiredString(req.params.id, 'id');
  const { status } = req.body as { status: string };
  const data = await service.updateFiscalDocumentStatus(id, status);
  res.json(data);
}

export async function revalidate(req: Request, res: Response) {
  const id = getRequiredString(req.params.id, 'id');
  const data = await service.revalidateDocument(id);
  res.json(data);
}

export async function remove(req: Request, res: Response) {
  const id = getRequiredString(req.params.id, 'id');
  await service.deleteFiscalDocument(id);
  res.status(204).send();
}
