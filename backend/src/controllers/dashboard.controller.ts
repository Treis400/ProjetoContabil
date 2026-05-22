import { Request, Response } from 'express';
import { getDashboardSummary } from '../services/dashboard.service.js';

export async function summary(_request: Request, response: Response) {
  const data = await getDashboardSummary();
  return response.json(data);
}
