import { Request, Response, NextFunction } from 'express';

function stripDangerousKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = stripDangerousKeys(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function sanitizeString(value: string): string {
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, 2000);
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return stripDangerousKeys(value as Record<string, unknown>);
  }
  return value;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      req.query[key] = sanitizeValue(req.query[key]) as never;
    }
  }

  if (req.body && typeof req.body === 'object') {
    req.body = stripDangerousKeys(req.body as Record<string, unknown>);
  }

  next();
}
