import { Response } from 'express';
import * as alertService from '../services/alert.service.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { getRequiredString } from '../utils/request.js';

export async function listAlerts(_request: AuthRequest, response: Response) {
  const alerts = await alertService.listAlerts();
  return response.json(alerts);
}

export async function resolveAlert(request: AuthRequest, response: Response) {
  const alertId = getRequiredString(request.params.id, 'Alerta');
  const alert = await alertService.resolveAlert(alertId, request.user!.id);
  return response.json(alert);
}
