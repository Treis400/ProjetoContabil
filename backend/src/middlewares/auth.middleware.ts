import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../utils/env.js';
import { prisma } from '../prisma/client.js'; 

export type AuthUser = {
  id: string;
  role: UserRole;
};

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export async function ensureAuthenticated(
  request: AuthRequest,
  response: Response,
  next: NextFunction,
) {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Acesso negado: Token de acesso inválido ou não informado.' });
  }

  const [, token] = authorization.split(' ');

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthUser;
    
    const userActiveCheck = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { active: true, role: true }
    });

    if (!userActiveCheck || !userActiveCheck.active) {
      return response.status(401).json({ message: 'Sessão inválida: Usuário inativo ou não encontrado.' });
    }

    request.user = {
      id: payload.id,
      role: userActiveCheck.role 
    };

    return next();
  } catch (error) {
    return response.status(401).json({ message: 'Sessão expirada: Por favor, faça login novamente.' });
  }
}

export function ensureRole(roles: UserRole[]) {
  return (request: AuthRequest, response: Response, next: NextFunction) => {
    
    
    if (!request.user) {
      return response.status(401).json({ message: 'Acesso negado: Usuário não identificado na sessão.' });
    }

    
    if (!roles.includes(request.user.role)) {
      return response.status(403).json({ 
        message: 'Acesso negado: Você não possui privilégios operacionais para esta ação.' 
      });
    }

    return next();
  };
}