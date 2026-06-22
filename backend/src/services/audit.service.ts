import { AuditAction, Prisma } from '@prisma/client';
import { Request } from 'express';
import { prisma } from '../prisma/client.js';

type AuditInput = {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  request?: Request;
};

const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'token',
  'secret',
  'creditCard',
  'senha',
  'faturamento',
];

function sanitizeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const cleanMetadata = { ...metadata };

  for (const key of Object.keys(cleanMetadata)) {
    if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
      cleanMetadata[key] = '[DADO_SENSIVEL_REDAZIDO]';
    } else if (typeof cleanMetadata[key] === 'object' && cleanMetadata[key] !== null) {
      cleanMetadata[key] = sanitizeMetadata(cleanMetadata[key] as Record<string, unknown>);
    }
  }

  return cleanMetadata;
}

function extractIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.socket?.remoteAddress;
}

export async function createAuditLog(input: AuditInput) {
  const safeMetadata = sanitizeMetadata(input.metadata);

  let safeSummary = input.summary;
  for (const sensitiveKey of SENSITIVE_KEYS) {
    if (safeSummary.toLowerCase().includes(sensitiveKey)) {
      safeSummary += ' [Contém dados filtrados por política de segurança]';
      break;
    }
  }

  const ipAddress = input.request ? extractIp(input.request) : undefined;
  const userAgent = input.request
    ? (input.request.headers['user-agent']?.slice(0, 500) ?? undefined)
    : undefined;

  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      summary: safeSummary,
      metadata: safeMetadata as Prisma.InputJsonValue | undefined,
      ipAddress,
      userAgent,
    },
  });
}