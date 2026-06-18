import { prisma } from '../prisma/client.js';
import { generateSpedFiscal } from './sped-fiscal.service.js';
import { generateSpedContribuicoes } from './sped-contribuicoes.service.js';
import { generateReinf } from './reinf.service.js';

export async function listObligations(clientId: string, year?: number) {
  return prisma.fiscalObligation.findMany({
    where: { clientId, ...(year ? { periodYear: year } : {}) },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { type: 'asc' }],
  });
}

export async function getObligation(id: string) {
  return prisma.fiscalObligation.findUniqueOrThrow({ where: { id } });
}

export async function createObligation(data: {
  clientId: string;
  type: string;
  periodMonth: number;
  periodYear: number;
  dueDate?: string;
  notes?: string;
  userId?: string;
}) {
  return prisma.fiscalObligation.create({
    data: {
      clientId: data.clientId,
      type: data.type as never,
      periodMonth: data.periodMonth,
      periodYear: data.periodYear,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      notes: data.notes,
      createdById: data.userId,
    },
  });
}

export async function generateObligation(id: string): Promise<{ fileName: string; content: string }> {
  const ob = await prisma.fiscalObligation.findUniqueOrThrow({ where: { id } });

  let content = '';
  let fileName = '';

  try {
    switch (ob.type) {
      case 'SPED_FISCAL': {
        content  = await generateSpedFiscal(ob.clientId, ob.periodMonth, ob.periodYear);
        fileName = `SPED_ICMS_IPI_${ob.periodYear}${String(ob.periodMonth).padStart(2, '0')}.txt`;
        break;
      }
      case 'SPED_CONTRIBUICOES': {
        content  = await generateSpedContribuicoes(ob.clientId, ob.periodMonth, ob.periodYear);
        fileName = `EFD_PIS_COFINS_${ob.periodYear}${String(ob.periodMonth).padStart(2, '0')}.txt`;
        break;
      }
      case 'REINF': {
        content  = await generateReinf(ob.clientId, ob.periodMonth, ob.periodYear);
        fileName = `REINF_${ob.periodYear}${String(ob.periodMonth).padStart(2, '0')}.xml`;
        break;
      }
      default:
        throw new Error(`Geração automática não disponível para o tipo ${ob.type}`);
    }

    await prisma.fiscalObligation.update({
      where: { id },
      data: { status: 'GERADA', fileContent: content, fileName, generatedAt: new Date(), errorMessage: null },
    });

    return { fileName, content };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    await prisma.fiscalObligation.update({
      where: { id },
      data: { status: 'ERRO', errorMessage: msg },
    });
    throw err;
  }
}

export async function markTransmitted(id: string) {
  return prisma.fiscalObligation.update({
    where: { id },
    data: { status: 'TRANSMITIDA', transmittedAt: new Date() },
  });
}

export async function markDispensed(id: string, notes?: string) {
  return prisma.fiscalObligation.update({
    where: { id },
    data: { status: 'DISPENSADA', notes },
  });
}

export async function deleteObligation(id: string) {
  const ob = await prisma.fiscalObligation.findUniqueOrThrow({ where: { id } });
  if (ob.status === 'TRANSMITIDA') throw new Error('Obrigação transmitida não pode ser excluída.');
  return prisma.fiscalObligation.delete({ where: { id } });
}
