import { z } from 'zod';

export const taxReviewSchema = z.object({
  clientId: z.string().min(1),
  year: z.number().int().min(2020),
  status: z.enum([
    'SIMPLES_NACIONAL_ATIVO',
    'SIMPLES_NACIONAL_EXCLUIDO',
    'MEI_ATIVO',
    'MEI_DESENQUADRADO',
    'LUCRO_PRESUMIDO',
    'LUCRO_REAL',
  ]),
  verificationDate: z.string(),
  notes: z.string().optional().nullable(),
});
