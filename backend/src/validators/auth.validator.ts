import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(128, 'Senha deve ter no máximo 128 caracteres')
  .refine((val) => /[A-Z]/.test(val), 'Senha deve conter ao menos uma letra maiúscula')
  .refine((val) => /[a-z]/.test(val), 'Senha deve conter ao menos uma letra minúscula')
  .refine((val) => /[0-9]/.test(val), 'Senha deve conter ao menos um número')
  .refine((val) => /[^A-Za-z0-9]/.test(val), 'Senha deve conter ao menos um caractere especial');

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido').max(254).toLowerCase(),
  password: z.string().min(1, 'Senha é obrigatória').max(128),
});

export const createUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(100).trim(),
  email: z.string().email('E-mail inválido').max(254).toLowerCase(),
  password: passwordSchema,
  role: z.enum(['ADMIN', 'EMPLOYEE']),
  active: z.boolean().optional(),
});
