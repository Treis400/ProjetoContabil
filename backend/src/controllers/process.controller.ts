import { Request, Response } from 'express';
import * as processService from '../services/process.service.js';
import {
  processSchema,
  processStatusSchema,
  processStepSchema,
} from '../validators/process.validator.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { getOptionalString, getRequiredString } from '../utils/request.js';

export async function listProcesses(request: Request, response: Response) {
  const processes = await processService.listProcesses({
    clientId: getOptionalString(request.query.clientId),
    type: getOptionalString(request.query.type),
    responsibleId: getOptionalString(request.query.responsibleId),
    status: getOptionalString(request.query.status),
    date: getOptionalString(request.query.date),
  });

  return response.json(processes);
}

export async function getProcess(request: Request, response: Response) {
  const processId = getRequiredString(request.params.id, 'Processo');
  const process = await processService.getProcessById(processId);
  return response.json(process);
}

export async function createProcess(request: AuthRequest, response: Response) {
  const data = processSchema.parse(request.body);
  const process = await processService.createProcess(data, request.user!.id);
  return response.status(201).json(process);
}

export async function updateProcess(request: AuthRequest, response: Response) {
  const data = processSchema.parse(request.body);
  const processId = getRequiredString(request.params.id, 'Processo');
  const process = await processService.updateProcess(processId, data, request.user!.id);
  return response.json(process);
}

export async function updateProcessStatus(request: AuthRequest, response: Response) {
  const data = processStatusSchema.parse(request.body);
  const processId = getRequiredString(request.params.id, 'Processo');
  const process = await processService.updateProcessStatus(
    processId,
    data.status,
    data.description,
    request.user!.id,
  );

  return response.json(process);
}

export async function getProcessSteps(request: Request, response: Response) {
  const processId = getRequiredString(request.params.id, 'Processo');
  const process = await processService.getProcessById(processId);
  return response.json(process.steps);
}

export async function createProcessStep(request: Request, response: Response) {
  const data = processStepSchema.parse(request.body);
  const processId = getRequiredString(request.params.id, 'Processo');
  const step = await processService.addProcessStep(processId, data);
  return response.status(201).json(step);
}

export async function updateProcessStep(request: Request, response: Response) {
  const data = processStepSchema.parse(request.body);
  const processId = getRequiredString(request.params.id, 'Processo');
  const stepId = getRequiredString(request.params.stepId, 'Etapa');
  const step = await processService.updateProcessStep(processId, stepId, data);
  return response.json(step);
}

export async function getProcessMovements(request: Request, response: Response) {
  const processId = getRequiredString(request.params.id, 'Processo');
  const movements = await processService.listProcessMovements(processId);
  return response.json(movements);
}

export async function getKanban(_request: Request, response: Response) {
  const data = await processService.listKanban();
  return response.json(data);
}
