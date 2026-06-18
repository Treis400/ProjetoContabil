import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

export async function listFiscalProducts(clientId: string, search?: string) {
  const where: Prisma.FiscalProductWhereInput = {
    clientId,
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { internalCode: { contains: search, mode: 'insensitive' } },
            { ncm: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  return prisma.fiscalProduct.findMany({
    where,
    orderBy: { description: 'asc' },
  });
}

export async function getFiscalProductById(id: string) {
  const product = await prisma.fiscalProduct.findUnique({ where: { id } });
  if (!product) throw new AppError('Produto fiscal não encontrado.', 404);
  return product;
}

export async function createFiscalProduct(clientId: string, data: Prisma.FiscalProductUncheckedCreateInput) {
  const existing = await prisma.fiscalProduct.findUnique({
    where: { clientId_internalCode: { clientId, internalCode: data.internalCode } },
  });
  if (existing) throw new AppError('Já existe um produto com este código interno para este cliente.', 409);

  return prisma.fiscalProduct.create({ data: { ...data, clientId } });
}

export async function updateFiscalProduct(id: string, data: Prisma.FiscalProductUpdateInput) {
  await getFiscalProductById(id);
  return prisma.fiscalProduct.update({ where: { id }, data });
}

export async function deleteFiscalProduct(id: string) {
  await getFiscalProductById(id);
  await prisma.fiscalProduct.delete({ where: { id } });
}
