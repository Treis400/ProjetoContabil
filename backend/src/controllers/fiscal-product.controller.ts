import type { Request, Response } from 'express';
import { getOptionalString, getRequiredString } from '../utils/request.js';
import * as service from '../services/fiscal-product.service.js';

export async function list(req: Request, res: Response) {
  const clientId = getRequiredString(req.params.clientId, 'clientId');
  const search = getOptionalString(req.query.search);
  const data = await service.listFiscalProducts(clientId, search);
  res.json(data);
}

export async function getById(req: Request, res: Response) {
  const id = getRequiredString(req.params.id, 'id');
  const data = await service.getFiscalProductById(id);
  res.json(data);
}

export async function create(req: Request, res: Response) {
  const clientId = getRequiredString(req.params.clientId, 'clientId');
  const data = await service.createFiscalProduct(clientId, req.body);
  res.status(201).json(data);
}

export async function update(req: Request, res: Response) {
  const id = getRequiredString(req.params.id, 'id');
  const data = await service.updateFiscalProduct(id, req.body);
  res.json(data);
}

export async function remove(req: Request, res: Response) {
  const id = getRequiredString(req.params.id, 'id');
  await service.deleteFiscalProduct(id);
  res.status(204).send();
}
