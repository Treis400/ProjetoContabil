import { AuditAction } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { createAuditLog } from './audit.service.js';

export async function listTaxReviews() {
  return prisma.taxAnnualReview.findMany({
    include: {
      client: true,
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { year: 'desc' },
      { verificationDate: 'desc' },
    ],
  });
}

export async function createTaxReview(
  data: {
    clientId: string;
    year: number;
    status: 'SIMPLES_NACIONAL_ATIVO' | 'SIMPLES_NACIONAL_EXCLUIDO' | 'MEI_ATIVO' | 'MEI_DESENQUADRADO' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
    verificationDate: string;
    notes?: string | null;
  },
  userId: string,
) {
  const review = await prisma.taxAnnualReview.upsert({
    where: {
      clientId_year: {
        clientId: data.clientId,
        year: data.year,
      },
    },
    update: {
      status: data.status,
      verificationDate: new Date(data.verificationDate),
      notes: data.notes || null,
      reviewedById: userId,
    },
    create: {
      clientId: data.clientId,
      year: data.year,
      status: data.status,
      verificationDate: new Date(data.verificationDate),
      notes: data.notes || null,
      reviewedById: userId,
    },
    include: {
      client: true,
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await prisma.clientTaxProfile.updateMany({
    where: { clientId: data.clientId },
    data: {
      currentTaxSituation: data.status,
    },
  });

  await createAuditLog({
    userId,
    action: AuditAction.UPDATE,
    entity: 'TaxAnnualReview',
    entityId: review.id,
    summary: `Revisao tributaria ${data.year} registrada.`,
  });

  return review;
}

export async function updateTaxReview(
  id: string,
  data: {
    clientId: string;
    year: number;
    status: 'SIMPLES_NACIONAL_ATIVO' | 'SIMPLES_NACIONAL_EXCLUIDO' | 'MEI_ATIVO' | 'MEI_DESENQUADRADO' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
    verificationDate: string;
    notes?: string | null;
  },
  userId: string,
) {
  const review = await prisma.taxAnnualReview.update({
    where: { id },
    data: {
      clientId: data.clientId,
      year: data.year,
      status: data.status,
      verificationDate: new Date(data.verificationDate),
      notes: data.notes || null,
      reviewedById: userId,
    },
    include: {
      client: true,
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await prisma.clientTaxProfile.updateMany({
    where: { clientId: data.clientId },
    data: {
      currentTaxSituation: data.status,
    },
  });

  await createAuditLog({
    userId,
    action: AuditAction.UPDATE,
    entity: 'TaxAnnualReview',
    entityId: review.id,
    summary: `Revisao tributaria ${data.year} atualizada.`,
  });

  return review;
}
