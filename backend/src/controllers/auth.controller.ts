import { Request, Response } from 'express';
import { createUserSchema, loginSchema } from '../validators/auth.validator.js';
import * as authService from '../services/auth.service.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { getRequiredString } from '../utils/request.js';

export async function login(request: Request, response: Response) {
  const data = loginSchema.parse(request.body);
  const result = await authService.login(data.email, data.password, request);
  return response.json(result);
}

export async function me(request: AuthRequest, response: Response) {
  const user = await authService.me(request.user!.id);
  return response.json(user);
}

export async function createUser(request: AuthRequest, response: Response) {
  const data = createUserSchema.parse(request.body);
  const user = await authService.createUser({
    ...data,
    createdById: request.user!.id,
  });

  return response.status(201).json(user);
}

export async function listUsers(_request: Request, response: Response) {
  const users = await authService.listUsers();
  return response.json(users);
}

export async function toggleUserStatus(request: AuthRequest, response: Response) {
  const userId = getRequiredString(request.params.id, 'Usuario');
  const user = await authService.toggleUserStatus(
    userId,
    Boolean(request.body.active),
    request.user!.id,
  );

  return response.json(user);
}
