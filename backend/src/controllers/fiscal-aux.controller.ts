import type { Request, Response } from 'express';
import { CfopOperationType, CstTaxType } from '@prisma/client';
import { getOptionalString, getRequiredString } from '../utils/request.js';
import * as service from '../services/fiscal-aux.service.js';

export async function listCfop(req: Request, res: Response) {
  const operationType = getOptionalString(req.query.operationType) as CfopOperationType | undefined;
  const search = getOptionalString(req.query.search);
  const data = await service.listCfop(operationType, search);
  res.json(data);
}

export async function upsertCfop(req: Request, res: Response) {
  const data = await service.upsertCfop(req.body);
  res.json(data);
}

export async function deleteCfop(req: Request, res: Response) {
  const id = getRequiredString(req.params.id, 'id');
  await service.deleteCfop(id);
  res.status(204).send();
}

export async function listCst(req: Request, res: Response) {
  const taxType = getOptionalString(req.query.taxType) as CstTaxType | undefined;
  const search = getOptionalString(req.query.search);
  const data = await service.listCst(taxType, search);
  res.json(data);
}

export async function upsertCst(req: Request, res: Response) {
  const data = await service.upsertCst(req.body);
  res.json(data);
}

export async function listNcm(req: Request, res: Response) {
  const search = getOptionalString(req.query.search);
  const data = await service.listNcm(search);
  res.json(data);
}

export async function listCest(req: Request, res: Response) {
  const ncm = getOptionalString(req.query.ncm);
  const search = getOptionalString(req.query.search);
  const data = await service.listCest(ncm, search);
  res.json(data);
}

export async function listOperationNatures(req: Request, res: Response) {
  const clientId = getOptionalString(req.query.clientId);
  const search = getOptionalString(req.query.search);
  const data = await service.listOperationNatures(clientId, search);
  res.json(data);
}

export async function createOperationNature(req: Request, res: Response) {
  const data = await service.createOperationNature(req.body);
  res.status(201).json(data);
}

export async function updateOperationNature(req: Request, res: Response) {
  const id = getRequiredString(req.params.id, 'id');
  const data = await service.updateOperationNature(id, req.body);
  res.json(data);
}

export async function deleteOperationNature(req: Request, res: Response) {
  const id = getRequiredString(req.params.id, 'id');
  await service.deleteOperationNature(id);
  res.status(204).send();
}
