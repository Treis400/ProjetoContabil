import { z } from 'zod';

export const processSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  type: z.enum([
    'ABERTURA_EMPRESA',
    'ALTERACAO_EMPRESA',
    'ENCERRAMENTO_EMPRESA',
    'FISCAL',
    'DP',
    'IMPOSTO_RENDA',
    'OUTRO',
  ]),
  status: z.enum(['ESCRITORIO_EXECUTANDO', 'PARADO_COM_CLIENTE', 'CONCLUIDO']),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']),
  responsibleId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  flowTemplateId: z.string().optional().nullable(),
  fee: z
    .object({
      totalAmount: z.number().nonnegative(),
      paymentMethod: z.enum([
        'PIX',
        'BOLETO',
        'DINHEIRO',
        'CARTAO_CREDITO',
        'CARTAO_DEBITO',
        'TRANSFERENCIA',
        'OUTRO',
      ]),
      installmentsCount: z.number().int().min(1),
      paymentStatus: z.enum(['PENDENTE', 'PARCIAL', 'PAGO']),
      installments: z.array(
        z.object({
          sequence: z.number().int().min(1),
          dueDate: z.string(),
          amount: z.number().nonnegative(),
          status: z.enum(['PENDENTE', 'PARCIAL', 'PAGO']),
          paidAt: z.string().optional().nullable(),
        }),
      ),
    })
    .optional()
    .nullable(),
  pendingIssues: z
    .array(
      z.object({
        type: z.enum([
          'DEBITO_TRIBUTARIO',
          'OBRIGACAO_ACESSORIA_ATRASADA',
          'FALTA_DOCUMENTO',
          'PENDENCIA_MUNICIPAL',
          'PENDENCIA_ESTADUAL',
          'ORGAO_REGULADOR',
          'OUTRA',
        ]),
        description: z.string().min(3),
      }),
    )
    .optional()
    .default([]),
  closureData: z
    .object({
      closureEffectiveDate: z.string().optional().nullable(),
      protocolNumber: z.string().optional().nullable(),
      finalNotes: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export const processStatusSchema = z.object({
  status: z.enum(['ESCRITORIO_EXECUTANDO', 'PARADO_COM_CLIENTE', 'CONCLUIDO']),
  description: z.string().min(3),
});

export const processStepSchema = z.object({
  title: z.string().min(3),
  orderIndex: z.number().int().min(1),
  status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'AGUARDANDO_CLIENTE', 'CONCLUIDO']),
  responsibleId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ProcessInput = z.infer<typeof processSchema>;
