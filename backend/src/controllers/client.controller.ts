import { Request, Response } from 'express';
import * as clientService from '../services/client.service.js';
import { clientSchema } from '../validators/client.validator.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { getOptionalString, getRequiredString } from '../utils/request.js';

export async function listClients(request: Request, response: Response) {
  const clients = await clientService.listClients({
    search: getOptionalString(request.query.search),
    taxRegime: getOptionalString(request.query.taxRegime),
    serviceType: getOptionalString(request.query.serviceType),
    companyStatus: getOptionalString(request.query.companyStatus),
  });

  return response.json(clients);
}

export async function getClient(request: Request, response: Response) {
  const clientId = getRequiredString(request.params.id, 'Cliente');
  const client = await clientService.getClientById(clientId);
  return response.json(client);
}

export async function createClient(request: AuthRequest, response: Response) {
  const data = clientSchema.parse(request.body);
  const client = await clientService.createClient(data, request.user!.id);
  return response.status(201).json(client);
}

export async function updateClient(request: AuthRequest, response: Response) {
  const data = clientSchema.parse(request.body);
  const clientId = getRequiredString(request.params.id, 'Cliente');
  const client = await clientService.updateClient(clientId, data, request.user!.id);
  return response.json(client);
}

export async function deleteClient(request: AuthRequest, response: Response) {
  const clientId = getRequiredString(request.params.id, 'Cliente');
  await clientService.deleteClient(clientId, request.user!.id);
  return response.status(204).send();
}

export async function getClientChangeLog(request: Request, response: Response) {
  const clientId = getRequiredString(request.params.id, 'Cliente');
  const items = await clientService.listClientChangeLog(clientId);
  return response.json(items);
}
