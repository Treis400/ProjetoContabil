import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

type AppError = Error & {
  statusCode?: number;
};

export function errorHandler(
  error: AppError,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: 'Dados invalidos.',
      issues: error.flatten(),
    });
  }

  return response.status(error.statusCode ?? 500).json({
    message: error.message || 'Erro interno do servidor.',
  });
}
