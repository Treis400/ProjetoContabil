import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../utils/env.js';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AuthRequest = Request & {
  user?: AuthUser;
};

export function ensureAuthenticated(
  request: AuthRequest,
  response: Response,
  next: NextFunction,
) {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return response.status(401).json({ message: 'Token de acesso nao informado.' });
  }

  const [, token] = authorization.split(' ');

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthUser;
    request.user = payload;
    return next();
  } catch (error) {
    return response.status(401).json({ message: 'Token invalido ou expirado.' });
  }
}

export function ensureRole(roles: UserRole[]) {
  return (request: AuthRequest, response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ message: 'Voce nao possui permissao para esta operacao.' });
    }

    return next();
  };
}
