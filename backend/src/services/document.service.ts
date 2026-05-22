import path from 'node:path';
import { AuditAction, DocumentEntityType } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { createAuditLog } from './audit.service.js';

export async function listDocuments(filters: {
  clientId?: string;
  processId?: string;
}) {
  return prisma.document.findMany({
    where: {
      clientId: filters.clientId,
      processId: filters.processId,
    },
    include: {
      client: true,
      process: true,
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function uploadDocument(input: {
  file: Express.Multer.File | undefined;
  entityType: DocumentEntityType;
  clientId?: string;
  processId?: string;
  userId: string;
}) {
  if (!input.file) {
    throw new AppError('Arquivo nao enviado.');
  }

  if (input.entityType === 'CLIENT' && !input.clientId) {
    throw new AppError('Cliente nao informado.');
  }

  if (input.entityType === 'PROCESS' && !input.processId) {
    throw new AppError('Processo nao informado.');
  }

  const document = await prisma.document.create({
    data: {
      originalName: input.file.originalname,
      fileName: input.file.filename,
      storagePath: path.relative(process.cwd(), input.file.path),
      mimeType: input.file.mimetype,
      size: input.file.size,
      entityType: input.entityType,
      clientId: input.clientId,
      processId: input.processId,
      uploadedById: input.userId,
    },
    include: {
      uploadedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  await createAuditLog({
    userId: input.userId,
    action: AuditAction.UPLOAD,
    entity: 'Document',
    entityId: document.id,
    summary: `Documento ${document.originalName} enviado.`,
  });

  return document;
}

export async function getDocumentById(id: string) {
  const document = await prisma.document.findUnique({
    where: { id },
  });

  if (!document) {
    throw new AppError('Documento nao encontrado.', 404);
  }

  return document;
}
