import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

export async function listFiscalServices(clientId: string, search?: string) {
  const where: Prisma.FiscalServiceWhereInput = {
    clientId,
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { internalCode: { contains: search, mode: 'insensitive' } },
            { lc116Code: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  return prisma.fiscalService.findMany({
    where,
    orderBy: { description: 'asc' },
  });
}

export async function getFiscalServiceById(id: string) {
  const service = await prisma.fiscalService.findUnique({ where: { id } });
  if (!service) throw new AppError('Serviço fiscal não encontrado.', 404);
  return service;
}

export async function createFiscalService(clientId: string, data: Prisma.FiscalServiceUncheckedCreateInput) {
  const existing = await prisma.fiscalService.findUnique({
    where: { clientId_internalCode: { clientId, internalCode: data.internalCode } },
  });
  if (existing) throw new AppError('Já existe um serviço com este código interno para este cliente.', 409);

  return prisma.fiscalService.create({ data: { ...data, clientId } });
}

export async function updateFiscalService(id: string, data: Prisma.FiscalServiceUpdateInput) {
  await getFiscalServiceById(id);
  return prisma.fiscalService.update({ where: { id }, data });
}

export async function deleteFiscalService(id: string) {
  await getFiscalServiceById(id);
  await prisma.fiscalService.delete({ where: { id } });
}
