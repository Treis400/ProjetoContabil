import { AppError } from './app-error.js';

export function getOptionalString(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }

  return undefined;
}

export function getRequiredString(value: unknown, fieldName: string) {
  const normalized = getOptionalString(value);

  if (!normalized) {
    throw new AppError(`${fieldName} nao informado.`);
  }

  return normalized;
}
