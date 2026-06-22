import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

type AppError = Error & {
  statusCode?: number;
};

export function errorHandler(
  error: AppError,
  request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: 'Dados inválidos.',
      issues: error.flatten(),
    });
  }

  const statusCode = error.statusCode ?? 500;

  if (!isProduction) {
    console.error(`[${request.method}] ${request.path}`, error);
  }

  if (statusCode >= 500 && isProduction) {
    return response.status(500).json({ message: 'Erro interno do servidor.' });
  }

  return response.status(statusCode).json({
    message: error.message || 'Erro interno do servidor.',
  });
}
