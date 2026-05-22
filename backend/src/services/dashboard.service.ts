import { CompanyType, ProcessStatus, TaxReviewStatus } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { syncAlerts } from './alert.service.js';

export async function getDashboardSummary() {
  await syncAlerts();

  const now = new Date();
  const nextSevenDays = new Date();
  nextSevenDays.setDate(now.getDate() + 7);
  const currentYear = now.getFullYear();

  const [
    processCounts,
    overdueProcesses,
    nearDueProcesses,
    byResponsible,
    simpleNationalCompanies,
    meiCompanies,
    taxPending,
  ] = await Promise.all([
    prisma.process.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.process.count({
      where: {
        dueDate: { lt: now },
        status: { not: ProcessStatus.CONCLUIDO },
      },
    }),
    prisma.process.count({
      where: {
        dueDate: { gte: now, lte: nextSevenDays },
        status: { not: ProcessStatus.CONCLUIDO },
      },
    }),
    prisma.process.groupBy({
      by: ['responsibleId'],
      _count: { _all: true },
      where: {
        responsibleId: { not: null },
      },
    }),
    prisma.client.count({
      where: {
        taxProfile: {
          companyType: CompanyType.SIMPLES_NACIONAL,
        },
      },
    }),
    prisma.client.count({
      where: {
        taxProfile: {
          companyType: CompanyType.MEI,
        },
      },
    }),
    prisma.client.count({
      where: {
        OR: [
          {
            taxReviews: {
              none: {
                year: currentYear,
              },
            },
          },
          {
            taxReviews: {
              some: {
                year: currentYear,
                status: {
                  in: [TaxReviewStatus.SIMPLES_NACIONAL_EXCLUIDO, TaxReviewStatus.MEI_DESENQUADRADO],
                },
              },
            },
          },
        ],
      },
    }),
  ]);

  const processByStatus = {
    emAndamento:
      processCounts.find((item) => item.status === ProcessStatus.ESCRITORIO_EXECUTANDO)?._count._all ?? 0,
    paradoComCliente:
      processCounts.find((item) => item.status === ProcessStatus.PARADO_COM_CLIENTE)?._count._all ?? 0,
    concluidos:
      processCounts.find((item) => item.status === ProcessStatus.CONCLUIDO)?._count._all ?? 0,
  };

  const responsibleIds = byResponsible.map((item) => item.responsibleId).filter(Boolean) as string[];
  const responsibleUsers = responsibleIds.length
    ? await prisma.user.findMany({
        where: { id: { in: responsibleIds } },
        select: { id: true, name: true },
      })
    : [];

  return {
    cards: {
      processosEmAndamento: processByStatus.emAndamento,
      processosParadosCliente: processByStatus.paradoComCliente,
      processosConcluidos: processByStatus.concluidos,
      processosAtrasados: overdueProcesses,
      processosProximosVencimento: nearDueProcesses,
      empresasSimplesNacional: simpleNationalCompanies,
      empresasMei: meiCompanies,
      revisoesTributariasPendentes: taxPending,
    },
    processosPorResponsavel: byResponsible.map((item) => ({
      responsibleId: item.responsibleId,
      responsibleName:
        responsibleUsers.find((user) => user.id === item.responsibleId)?.name ?? 'Sem responsavel',
      count: item._count._all,
    })),
  };
}
