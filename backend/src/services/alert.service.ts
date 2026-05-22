import { AlertSeverity, AlertType, ProcessStatus, TaxReviewStatus } from '@prisma/client';
import { prisma } from '../prisma/client.js';

type SyncAlert = {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description?: string;
  dueDate?: Date;
  clientId?: string;
  processId?: string;
};

async function upsertAlert(input: SyncAlert) {
  const existing = await prisma.alert.findFirst({
    where: {
      type: input.type,
      clientId: input.clientId,
      processId: input.processId,
      resolved: false,
    },
  });

  if (existing) {
    return prisma.alert.update({
      where: { id: existing.id },
      data: {
        severity: input.severity,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
      },
    });
  }

  return prisma.alert.create({
    data: {
      type: input.type,
      severity: input.severity,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      clientId: input.clientId,
      processId: input.processId,
    },
  });
}

export async function syncAlerts() {
  const now = new Date();
  const inSevenDays = new Date();
  inSevenDays.setDate(now.getDate() + 7);

  const overdueProcesses = await prisma.process.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: ProcessStatus.CONCLUIDO },
    },
  });

  const upcomingProcesses = await prisma.process.findMany({
    where: {
      dueDate: { gte: now, lte: inSevenDays },
      status: { not: ProcessStatus.CONCLUIDO },
    },
  });

  const waitingClosures = await prisma.process.findMany({
    where: {
      type: 'ENCERRAMENTO_EMPRESA',
      status: ProcessStatus.PARADO_COM_CLIENTE,
    },
  });

  const clientsWithCertificateExpiring = await prisma.client.findMany({
    where: {
      taxProfile: {
        digitalCertificateExpiry: {
          gte: now,
          lte: inSevenDays,
        },
      },
    },
    include: { taxProfile: true },
  });

  const currentYear = now.getFullYear();
  const allClients = await prisma.client.findMany({
    include: {
      taxReviews: {
        where: { year: currentYear },
      },
      taxProfile: true,
    },
  });

  const taxAttention = allClients.filter((client) => {
    const review = client.taxReviews[0];

    if (!review) {
      return true;
    }

    return (
      review.status === TaxReviewStatus.MEI_DESENQUADRADO ||
      review.status === TaxReviewStatus.SIMPLES_NACIONAL_EXCLUIDO
    );
  });

  for (const process of overdueProcesses) {
    await upsertAlert({
      type: AlertType.PROCESSO_ATRASADO,
      severity: AlertSeverity.CRITICAL,
      title: 'Processo atrasado',
      description: process.title,
      processId: process.id,
      clientId: process.clientId,
      dueDate: process.dueDate ?? undefined,
    });
  }

  for (const process of upcomingProcesses) {
    await upsertAlert({
      type: AlertType.PROCESSO_PROXIMO_VENCIMENTO,
      severity: AlertSeverity.WARNING,
      title: 'Processo proximo do vencimento',
      description: process.title,
      processId: process.id,
      clientId: process.clientId,
      dueDate: process.dueDate ?? undefined,
    });
  }

  for (const process of waitingClosures) {
    await upsertAlert({
      type: AlertType.ENCERRAMENTO_AGUARDANDO_CLIENTE,
      severity: AlertSeverity.WARNING,
      title: 'Encerramento aguardando cliente',
      description: process.title,
      processId: process.id,
      clientId: process.clientId,
      dueDate: process.dueDate ?? undefined,
    });
  }

  for (const client of clientsWithCertificateExpiring) {
    await upsertAlert({
      type: AlertType.CERTIFICADO_DIGITAL_PROXIMO_VENCIMENTO,
      severity: AlertSeverity.WARNING,
      title: 'Certificado digital proximo do vencimento',
      description: client.companyName,
      clientId: client.id,
      dueDate: client.taxProfile?.digitalCertificateExpiry ?? undefined,
    });
  }

  for (const client of taxAttention) {
    const review = client.taxReviews[0];
    const isPending = !review;

    await upsertAlert({
      type: isPending ? AlertType.REVISAO_TRIBUTARIA_PENDENTE : AlertType.PENDENCIA_FISCAL,
      severity: review ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
      title: isPending ? 'Revisao tributaria pendente' : 'Pendencia tributaria',
      description: client.companyName,
      clientId: client.id,
    });
  }
}

export async function listAlerts() {
  await syncAlerts();

  return prisma.alert.findMany({
    include: {
      client: true,
      process: true,
    },
    orderBy: [
      { resolved: 'asc' },
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function resolveAlert(id: string, userId: string) {
  return prisma.alert.update({
    where: { id },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedById: userId,
    },
  });
}
