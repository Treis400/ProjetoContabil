import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuditAction } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/app-error.js';
import { env } from '../utils/env.js';
import { createAuditLog } from './audit.service.js';

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.active) {
    throw new AppError('Usuario ou senha invalidos.', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError('Usuario ou senha invalidos.', 401);
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: '8h' },
  );

  await createAuditLog({
    userId: user.id,
    action: AuditAction.LOGIN,
    entity: 'User',
    entityId: user.id,
    summary: 'Login realizado com sucesso.',
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    },
  };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });

  if (!user) {
    throw new AppError('Usuario nao encontrado.', 404);
  }

  return user;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE';
  active?: boolean;
  createdById: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new AppError('Ja existe um usuario com este e-mail.');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      active: data.active ?? true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });

  await createAuditLog({
    userId: data.createdById,
    action: AuditAction.CREATE,
    entity: 'User',
    entityId: user.id,
    summary: `Usuario ${user.email} criado.`,
  });

  return user;
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function toggleUserStatus(userId: string, active: boolean, actorId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { active },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });

  await createAuditLog({
    userId: actorId,
    action: AuditAction.STATUS_CHANGE,
    entity: 'User',
    entityId: user.id,
    summary: `Status do usuario ${user.email} alterado para ${active ? 'ativo' : 'inativo'}.`,
  });

  return user;
}
