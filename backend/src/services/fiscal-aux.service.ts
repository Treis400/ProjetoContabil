import { CfopOperationType, CstTaxType, Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';

// CFOP
export async function listCfop(operationType?: CfopOperationType, search?: string) {
  return prisma.cfopTable.findMany({
    where: {
      active: true,
      ...(operationType ? { operationType } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { code: 'asc' },
  });
}

export async function upsertCfop(data: Prisma.CfopTableCreateInput) {
  return prisma.cfopTable.upsert({
    where: { code: data.code },
    update: data,
    create: data,
  });
}

export async function deleteCfop(id: string) {
  const cfop = await prisma.cfopTable.findUnique({ where: { id } });
  if (!cfop) throw new AppError('CFOP não encontrado.', 404);
  await prisma.cfopTable.delete({ where: { id } });
}

// CST
export async function listCst(taxType?: CstTaxType, search?: string) {
  return prisma.cstTable.findMany({
    where: {
      active: true,
      ...(taxType ? { taxType } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ taxType: 'asc' }, { code: 'asc' }],
  });
}

export async function upsertCst(data: Prisma.CstTableCreateInput) {
  return prisma.cstTable.upsert({
    where: { code_taxType: { code: data.code, taxType: data.taxType } },
    update: data,
    create: data,
  });
}

// NCM
export async function listNcm(search?: string) {
  return prisma.ncmTable.findMany({
    where: search
      ? {
          OR: [
            { code: { contains: search } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
    orderBy: { code: 'asc' },
    take: 100,
  });
}

// CEST
export async function listCest(ncm?: string, search?: string) {
  return prisma.cestTable.findMany({
    where: {
      ...(ncm ? { ncm: { contains: ncm } } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { code: 'asc' },
    take: 100,
  });
}

// Natureza de Operação
export async function listOperationNatures(clientId?: string, search?: string) {
  return prisma.operationNature.findMany({
    where: {
      active: true,
      OR: [{ clientId: clientId ?? null }, { clientId: null }],
      ...(search
        ? {
            OR: [
              { code: { contains: search } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { code: 'asc' },
  });
}

export async function createOperationNature(data: Prisma.OperationNatureUncheckedCreateInput) {
  return prisma.operationNature.create({ data });
}

export async function updateOperationNature(id: string, data: Prisma.OperationNatureUpdateInput) {
  const existing = await prisma.operationNature.findUnique({ where: { id } });
  if (!existing) throw new AppError('Natureza de operação não encontrada.', 404);
  return prisma.operationNature.update({ where: { id }, data });
}

export async function deleteOperationNature(id: string) {
  const existing = await prisma.operationNature.findUnique({ where: { id } });
  if (!existing) throw new AppError('Natureza de operação não encontrada.', 404);
  await prisma.operationNature.delete({ where: { id } });
}
