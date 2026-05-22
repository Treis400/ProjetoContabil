import { AuditAction, Prisma, ProcessStatus, StepStatus } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { createAuditLog } from './audit.service.js';
import type { ProcessInput } from '../validators/process.validator.js';

const processInclude = {
  client: true,
  responsible: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  steps: {
    orderBy: {
      orderIndex: 'asc' as const,
    },
  },
  movements: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
  pendingIssues: true,
  fee: {
    include: {
      installments: {
        orderBy: {
          sequence: 'asc' as const,
        },
      },
    },
  },
  documents: {
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
} satisfies Prisma.ProcessInclude;

function normalizeDate(value?: string | null) {
  return value ? new Date(value) : undefined;
}

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

async function getTemplateSteps(flowTemplateId?: string | null, type?: string) {
  const template = flowTemplateId
    ? await prisma.processFlowTemplate.findUnique({
        where: { id: flowTemplateId },
        include: { steps: { orderBy: { orderIndex: 'asc' } } },
      })
    : await prisma.processFlowTemplate.findFirst({
        where: {
          type: type as never,
          isDefault: true,
        },
        include: { steps: { orderBy: { orderIndex: 'asc' } } },
      });

  return template;
}

export async function listProcesses(filters: {
  clientId?: string;
  type?: string;
  responsibleId?: string;
  status?: string;
  date?: string;
}) {
  const where: Prisma.ProcessWhereInput = {
    AND: [
      filters.clientId ? { clientId: filters.clientId } : {},
      filters.type ? { type: filters.type as never } : {},
      filters.responsibleId ? { responsibleId: filters.responsibleId } : {},
      filters.status ? { status: filters.status as never } : {},
      filters.date
        ? {
            dueDate: {
              gte: new Date(`${filters.date}T00:00:00.000Z`),
              lte: new Date(`${filters.date}T23:59:59.999Z`),
            },
          }
        : {},
    ],
  };

  return prisma.process.findMany({
    where,
    include: {
      client: true,
      responsible: {
        select: {
          id: true,
          name: true,
        },
      },
      steps: {
        orderBy: {
          orderIndex: 'asc',
        },
      },
      pendingIssues: true,
      fee: {
        include: {
          installments: true,
        },
      },
    },
    orderBy: [
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function getProcessById(id: string) {
  const process = await prisma.process.findUnique({
    where: { id },
    include: processInclude,
  });

  if (!process) {
    throw new AppError('Processo nao encontrado.', 404);
  }

  return process;
}

export async function createProcess(data: ProcessInput, userId: string) {
  const template = await getTemplateSteps(data.flowTemplateId, data.type);

  const process = await prisma.process.create({
    data: {
      clientId: data.clientId,
      flowTemplateId: template?.id,
      title: data.title,
      description: data.description || null,
      type: data.type,
      status: data.status,
      priority: data.priority,
      responsibleId: data.responsibleId || null,
      dueDate: normalizeDate(data.dueDate) ?? null,
      notes: data.notes || null,
      closureEffectiveDate: normalizeDate(data.closureData?.closureEffectiveDate) ?? null,
      protocolNumber: data.closureData?.protocolNumber || null,
      finalNotes: data.closureData?.finalNotes || null,
      createdById: userId,
      updatedById: userId,
      steps: {
        create:
          template?.steps.map((step) => ({
            templateStepId: step.id,
            title: step.title,
            orderIndex: step.orderIndex,
          })) ?? [],
      },
      pendingIssues: {
        create:
          data.pendingIssues?.map((issue) => ({
            type: issue.type,
            description: issue.description,
          })) ?? [],
      },
      fee: data.fee
        ? {
            create: {
              totalAmount: toDecimal(data.fee.totalAmount),
              paymentMethod: data.fee.paymentMethod,
              installmentsCount: data.fee.installmentsCount,
              paymentStatus: data.fee.paymentStatus,
              installments: {
                create: data.fee.installments.map((installment) => ({
                  sequence: installment.sequence,
                  dueDate: new Date(installment.dueDate),
                  amount: toDecimal(installment.amount),
                  status: installment.status,
                  paidAt: normalizeDate(installment.paidAt) ?? null,
                })),
              },
            },
          }
        : undefined,
      movements: {
        create: {
          userId,
          description: 'Processo criado.',
          nextStatus: data.status,
        },
      },
    },
    include: processInclude,
  });

  await createAuditLog({
    userId,
    action: AuditAction.CREATE,
    entity: 'Process',
    entityId: process.id,
    summary: `Processo ${process.title} criado.`,
  });

  return process;
}

export async function updateProcess(id: string, data: ProcessInput, userId: string) {
  await getProcessById(id);

  const template = await getTemplateSteps(data.flowTemplateId, data.type);

  const process = await prisma.$transaction(async (transaction) => {
    await transaction.processPendingIssue.deleteMany({ where: { processId: id } });
    await transaction.processStep.deleteMany({ where: { processId: id } });

    const updated = await transaction.process.update({
      where: { id },
      data: {
        clientId: data.clientId,
        flowTemplateId: template?.id ?? null,
        title: data.title,
        description: data.description || null,
        type: data.type,
        status: data.status,
        priority: data.priority,
        responsibleId: data.responsibleId || null,
        dueDate: normalizeDate(data.dueDate) ?? null,
        notes: data.notes || null,
        closureEffectiveDate: normalizeDate(data.closureData?.closureEffectiveDate) ?? null,
        protocolNumber: data.closureData?.protocolNumber || null,
        finalNotes: data.closureData?.finalNotes || null,
        updatedById: userId,
        completedAt: data.status === 'CONCLUIDO' ? new Date() : null,
        steps: {
          create:
            template?.steps.map((step) => ({
              templateStepId: step.id,
              title: step.title,
              orderIndex: step.orderIndex,
            })) ?? [],
        },
        pendingIssues: {
          create:
            data.pendingIssues?.map((issue) => ({
              type: issue.type,
              description: issue.description,
            })) ?? [],
        },
      },
      include: processInclude,
    });

    if (data.fee) {
      const existingFee = await transaction.processFee.findUnique({
        where: { processId: id },
      });

      if (existingFee) {
        await transaction.processInstallment.deleteMany({
          where: { feeId: existingFee.id },
        });

        await transaction.processFee.update({
          where: { id: existingFee.id },
          data: {
            totalAmount: toDecimal(data.fee.totalAmount),
            paymentMethod: data.fee.paymentMethod,
            installmentsCount: data.fee.installmentsCount,
            paymentStatus: data.fee.paymentStatus,
            installments: {
              create: data.fee.installments.map((installment) => ({
                sequence: installment.sequence,
                dueDate: new Date(installment.dueDate),
                amount: toDecimal(installment.amount),
                status: installment.status,
                paidAt: normalizeDate(installment.paidAt) ?? null,
              })),
            },
          },
        });
      } else {
        await transaction.processFee.create({
          data: {
            processId: id,
            totalAmount: toDecimal(data.fee.totalAmount),
            paymentMethod: data.fee.paymentMethod,
            installmentsCount: data.fee.installmentsCount,
            paymentStatus: data.fee.paymentStatus,
            installments: {
              create: data.fee.installments.map((installment) => ({
                sequence: installment.sequence,
                dueDate: new Date(installment.dueDate),
                amount: toDecimal(installment.amount),
                status: installment.status,
                paidAt: normalizeDate(installment.paidAt) ?? null,
              })),
            },
          },
        });
      }
    }

    await transaction.processMovement.create({
      data: {
        processId: id,
        userId,
        description: 'Processo atualizado.',
        nextStatus: data.status,
      },
    });

    return updated;
  });

  await createAuditLog({
    userId,
    action: AuditAction.UPDATE,
    entity: 'Process',
    entityId: id,
    summary: `Processo ${process.title} atualizado.`,
  });

  return getProcessById(id);
}

export async function updateProcessStatus(
  id: string,
  status: ProcessStatus,
  description: string,
  userId: string,
) {
  const current = await getProcessById(id);

  const process = await prisma.process.update({
    where: { id },
    data: {
      status,
      updatedById: userId,
      completedAt: status === 'CONCLUIDO' ? new Date() : null,
    },
  });

  await prisma.processMovement.create({
    data: {
      processId: id,
      userId,
      description,
      previousStatus: current.status,
      nextStatus: status,
    },
  });

  await createAuditLog({
    userId,
    action: AuditAction.STATUS_CHANGE,
    entity: 'Process',
    entityId: id,
    summary: `Status do processo ${process.title} alterado para ${status}.`,
  });

  return getProcessById(id);
}

export async function addProcessStep(processId: string, input: {
  title: string;
  orderIndex: number;
  status: StepStatus;
  responsibleId?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}) {
  await getProcessById(processId);

  return prisma.processStep.create({
    data: {
      processId,
      title: input.title,
      orderIndex: input.orderIndex,
      status: input.status,
      responsibleId: input.responsibleId || null,
      dueDate: normalizeDate(input.dueDate) ?? null,
      notes: input.notes || null,
    },
  });
}

export async function updateProcessStep(
  processId: string,
  stepId: string,
  input: {
    title: string;
    orderIndex: number;
    status: StepStatus;
    responsibleId?: string | null;
    dueDate?: string | null;
    notes?: string | null;
  },
) {
  await getProcessById(processId);

  return prisma.processStep.update({
    where: { id: stepId },
    data: {
      title: input.title,
      orderIndex: input.orderIndex,
      status: input.status,
      responsibleId: input.responsibleId || null,
      dueDate: normalizeDate(input.dueDate) ?? null,
      notes: input.notes || null,
      completedAt: input.status === 'CONCLUIDO' ? new Date() : null,
    },
  });
}

export async function listProcessMovements(processId: string) {
  return prisma.processMovement.findMany({
    where: { processId },
    include: {
      user: {
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

export async function listKanban() {
  const processes = await prisma.process.findMany({
    include: {
      client: true,
      responsible: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { dueDate: 'asc' },
      { updatedAt: 'desc' },
    ],
  });

  return {
    ESCRITORIO_EXECUTANDO: processes.filter((item) => item.status === 'ESCRITORIO_EXECUTANDO'),
    PARADO_COM_CLIENTE: processes.filter((item) => item.status === 'PARADO_COM_CLIENTE'),
    CONCLUIDO: processes.filter((item) => item.status === 'CONCLUIDO'),
  };
}
