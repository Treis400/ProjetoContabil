import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';

type AuditInput = {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function createAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      summary: input.summary,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
