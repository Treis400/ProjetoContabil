import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { createAuditLog } from './audit.service.js';
import type { ClientInput } from '../validators/client.validator.js';

const clientInclude = {
  taxProfile: true,
  services: true,
  monthlyFees: {
    include: {
      adjustments: true,
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
  changeLogs: {
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
  documents: {
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
} satisfies Prisma.ClientInclude;

function normalizeDate(value?: string | null) {
  return value ? new Date(value) : undefined;
}

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

export async function listClients(filters: {
  search?: string;
  taxRegime?: string;
  serviceType?: string;
  companyStatus?: string;
}) {
  const where: Prisma.ClientWhereInput = {
    AND: [
      filters.search
        ? {
            OR: [
              { companyName: { contains: filters.search, mode: 'insensitive' } },
              { tradeName: { contains: filters.search, mode: 'insensitive' } },
              { cnpj: { contains: filters.search, mode: 'insensitive' } },
              { legalRepresentative: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {},
      filters.taxRegime ? { taxRegime: filters.taxRegime } : {},
      filters.companyStatus ? { companyStatus: filters.companyStatus as never } : {},
      filters.serviceType
        ? {
            services: {
              some: {
                serviceType: filters.serviceType as never,
              },
            },
          }
        : {},
    ],
  };

  return prisma.client.findMany({
    where,
    include: {
      taxProfile: true,
      services: true,
      monthlyFees: {
        where: { isCurrent: true },
      },
      _count: {
        select: {
          processes: true,
          documents: true,
        },
      },
    },
    orderBy: {
      companyName: 'asc',
    },
  });
}

export async function getClientById(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: clientInclude,
  });

  if (!client) {
    throw new AppError('Cliente nao encontrado.', 404);
  }

  return client;
}

export async function createClient(data: ClientInput, userId: string) {
  const existingClient = await prisma.client.findUnique({
    where: { cnpj: data.cnpj },
    select: { id: true },
  });

  if (existingClient) {
    throw new AppError('Ja existe um cliente cadastrado com este CNPJ.', 409);
  }

  const client = await prisma.client.create({
    data: {
      companyName: data.companyName,
      tradeName: data.tradeName || null,
      cnpj: data.cnpj,
      stateRegistration: data.stateRegistration || null,
      municipalRegistration: data.municipalRegistration || null,
      mainCnae: data.mainCnae || null,
      taxRegime: data.taxRegime || null,
      openingDate: normalizeDate(data.openingDate) ?? null,
      companyStatus: data.companyStatus,
      legalRepresentative: data.legalRepresentative || null,
      legalRepresentativeCpf: data.legalRepresentativeCpf || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      fullAddress: data.fullAddress || null,
      internalNotes: data.internalNotes || null,
      createdById: userId,
      updatedById: userId,
      taxProfile: {
        create: {
          companyType: data.taxProfile.companyType,
          cityHall: data.taxProfile.cityHall || null,
          regulatoryAgency: data.taxProfile.regulatoryAgency || null,
          digitalCertificate: data.taxProfile.digitalCertificate || null,
          digitalCertificateExpiry: normalizeDate(data.taxProfile.digitalCertificateExpiry) ?? null,
          currentTaxSituation: data.taxProfile.currentTaxSituation || null,
        },
      },
      services: {
        create: data.services.map((service) => ({
          serviceType: service.serviceType,
          description: service.description || null,
        })),
      },
      monthlyFees: {
        create: {
          amount: toDecimal(data.monthlyFee.amount),
          startDate: new Date(data.monthlyFee.startDate),
          status: data.monthlyFee.status,
          isCurrent: true,
        },
      },
      changeLogs: {
        create: {
          userId,
          fieldName: 'cadastro',
          oldValue: null,
          newValue: 'Cadastro inicial criado.',
        },
      },
    },
    include: clientInclude,
  });

  await createAuditLog({
    userId,
    action: AuditAction.CREATE,
    entity: 'Client',
    entityId: client.id,
    summary: `Cliente ${client.companyName} cadastrado.`,
  });

  return client;
}

export async function updateClient(id: string, data: ClientInput, userId: string) {
  const existing = await getClientById(id);
  const duplicatedClient = await prisma.client.findUnique({
    where: { cnpj: data.cnpj },
    select: { id: true },
  });

  if (duplicatedClient && duplicatedClient.id !== id) {
    throw new AppError('Ja existe um cliente cadastrado com este CNPJ.', 409);
  }

  const currentMonthlyFee = existing.monthlyFees.find((fee) => fee.isCurrent);

  const updated = await prisma.$transaction(async (transaction) => {
    if (currentMonthlyFee && Number(currentMonthlyFee.amount) !== data.monthlyFee.amount) {
      await transaction.clientMonthlyFee.update({
        where: { id: currentMonthlyFee.id },
        data: {
          isCurrent: false,
          adjustments: {
            create: {
              previousAmount: currentMonthlyFee.amount,
              newAmount: toDecimal(data.monthlyFee.amount),
              effectiveDate: new Date(data.monthlyFee.startDate),
              notes: 'Ajuste registrado durante atualizacao cadastral.',
            },
          },
        },
      });

      await transaction.clientMonthlyFee.create({
        data: {
          clientId: id,
          amount: toDecimal(data.monthlyFee.amount),
          startDate: new Date(data.monthlyFee.startDate),
          status: data.monthlyFee.status,
          isCurrent: true,
        },
      });
    } else if (currentMonthlyFee) {
      await transaction.clientMonthlyFee.update({
        where: { id: currentMonthlyFee.id },
        data: {
          startDate: new Date(data.monthlyFee.startDate),
          status: data.monthlyFee.status,
        },
      });
    }

    await transaction.clientService.deleteMany({ where: { clientId: id } });
    await transaction.clientService.createMany({
      data: data.services.map((service) => ({
        clientId: id,
        serviceType: service.serviceType,
        description: service.description || null,
      })),
    });

    await transaction.clientTaxProfile.upsert({
      where: { clientId: id },
      update: {
        companyType: data.taxProfile.companyType,
        cityHall: data.taxProfile.cityHall || null,
        regulatoryAgency: data.taxProfile.regulatoryAgency || null,
        digitalCertificate: data.taxProfile.digitalCertificate || null,
        digitalCertificateExpiry: normalizeDate(data.taxProfile.digitalCertificateExpiry) ?? null,
        currentTaxSituation: data.taxProfile.currentTaxSituation || null,
      },
      create: {
        clientId: id,
        companyType: data.taxProfile.companyType,
        cityHall: data.taxProfile.cityHall || null,
        regulatoryAgency: data.taxProfile.regulatoryAgency || null,
        digitalCertificate: data.taxProfile.digitalCertificate || null,
        digitalCertificateExpiry: normalizeDate(data.taxProfile.digitalCertificateExpiry) ?? null,
        currentTaxSituation: data.taxProfile.currentTaxSituation || null,
      },
    });

    await transaction.client.update({
      where: { id },
      data: {
        companyName: data.companyName,
        tradeName: data.tradeName || null,
        cnpj: data.cnpj,
        stateRegistration: data.stateRegistration || null,
        municipalRegistration: data.municipalRegistration || null,
        mainCnae: data.mainCnae || null,
        taxRegime: data.taxRegime || null,
        openingDate: normalizeDate(data.openingDate) ?? null,
        companyStatus: data.companyStatus,
        legalRepresentative: data.legalRepresentative || null,
        legalRepresentativeCpf: data.legalRepresentativeCpf || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        fullAddress: data.fullAddress || null,
        internalNotes: data.internalNotes || null,
        updatedById: userId,
      },
    });

    const trackedFields: Array<[string, string | null | undefined, string | null | undefined]> = [
      ['companyName', existing.companyName, data.companyName],
      ['tradeName', existing.tradeName, data.tradeName],
      ['cnpj', existing.cnpj, data.cnpj],
      ['taxRegime', existing.taxRegime, data.taxRegime],
      ['companyStatus', existing.companyStatus, data.companyStatus],
      ['legalRepresentative', existing.legalRepresentative, data.legalRepresentative],
    ];

    for (const [fieldName, oldValue, newValue] of trackedFields) {
      if ((oldValue ?? null) !== (newValue ?? null)) {
        await transaction.clientChangeLog.create({
          data: {
            clientId: id,
            userId,
            fieldName,
            oldValue: oldValue ?? null,
            newValue: newValue ?? null,
          },
        });
      }
    }

    return transaction.client.findUniqueOrThrow({
      where: { id },
      include: clientInclude,
    });
  });

  await createAuditLog({
    userId,
    action: AuditAction.UPDATE,
    entity: 'Client',
    entityId: id,
    summary: `Cliente ${updated.companyName} atualizado.`,
  });

  return updated;
}

export async function deleteClient(id: string, userId: string) {
  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
    throw new AppError('Cliente nao encontrado.', 404);
  }

  await prisma.client.delete({
    where: { id },
  });

  await createAuditLog({
    userId,
    action: AuditAction.DELETE,
    entity: 'Client',
    entityId: id,
    summary: `Cliente ${client.companyName} excluido.`,
  });
}

export async function listClientChangeLog(clientId: string) {
  return prisma.clientChangeLog.findMany({
    where: { clientId },
    include: {
      user: {
        select: {
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
