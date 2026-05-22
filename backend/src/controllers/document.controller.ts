import path from 'node:path';
import { Request, Response } from 'express';
import { DocumentEntityType } from '@prisma/client';
import * as documentService from '../services/document.service.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { getOptionalString, getRequiredString } from '../utils/request.js';

export async function listDocuments(request: Request, response: Response) {
  const documents = await documentService.listDocuments({
    clientId: getOptionalString(request.query.clientId),
    processId: getOptionalString(request.query.processId),
  });

  return response.json(documents);
}

export async function listClientDocuments(request: Request, response: Response) {
  const clientId = getRequiredString(request.params.id, 'Cliente');
  const documents = await documentService.listDocuments({
    clientId,
  });

  return response.json(documents);
}

export async function listProcessDocuments(request: Request, response: Response) {
  const processId = getRequiredString(request.params.id, 'Processo');
  const documents = await documentService.listDocuments({
    processId,
  });

  return response.json(documents);
}

export async function uploadClientDocument(request: AuthRequest, response: Response) {
  const clientId = getRequiredString(request.params.id, 'Cliente');
  const document = await documentService.uploadDocument({
    file: request.file,
    entityType: DocumentEntityType.CLIENT,
    clientId,
    userId: request.user!.id,
  });

  return response.status(201).json(document);
}

export async function uploadProcessDocument(request: AuthRequest, response: Response) {
  const processId = getRequiredString(request.params.id, 'Processo');
  const document = await documentService.uploadDocument({
    file: request.file,
    entityType: DocumentEntityType.PROCESS,
    processId,
    userId: request.user!.id,
  });

  return response.status(201).json(document);
}

export async function downloadDocument(request: Request, response: Response) {
  const documentId = getRequiredString(request.params.id, 'Documento');
  const document = await documentService.getDocumentById(documentId);
  return response.download(path.resolve(process.cwd(), document.storagePath), document.originalName);
}
