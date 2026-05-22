import { z } from 'zod';

const serviceType = z.enum([
  'CONTABILIDADE_REGULAR',
  'MEI',
  'FOLHA_DOMESTICA',
  'ASSESSORIA',
  'DEPARTAMENTO_PESSOAL',
  'FISCAL',
  'IMPOSTO_RENDA',
  'ABERTURA_EMPRESA',
  'ALTERACAO_CONTRATUAL',
  'ENCERRAMENTO_EMPRESA',
  'OUTROS',
]);

export const clientSchema = z.object({
  companyName: z.string().min(2),
  tradeName: z.string().optional().nullable(),
  cnpj: z.string().min(14),
  stateRegistration: z.string().optional().nullable(),
  municipalRegistration: z.string().optional().nullable(),
  mainCnae: z.string().optional().nullable(),
  taxRegime: z.string().optional().nullable(),
  openingDate: z.string().optional().nullable(),
  companyStatus: z.enum(['ATIVA', 'SUSPENSA', 'INATIVA', 'ENCERRADA']),
  legalRepresentative: z.string().optional().nullable(),
  legalRepresentativeCpf: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  fullAddress: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  taxProfile: z.object({
    companyType: z.enum(['MEI', 'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']),
    cityHall: z.string().optional().nullable(),
    regulatoryAgency: z.string().optional().nullable(),
    digitalCertificate: z.string().optional().nullable(),
    digitalCertificateExpiry: z.string().optional().nullable(),
    currentTaxSituation: z
      .enum([
        'SIMPLES_NACIONAL_ATIVO',
        'SIMPLES_NACIONAL_EXCLUIDO',
        'MEI_ATIVO',
        'MEI_DESENQUADRADO',
        'LUCRO_PRESUMIDO',
        'LUCRO_REAL',
      ])
      .optional()
      .nullable(),
  }),
  services: z.array(
    z.object({
      serviceType,
      description: z.string().optional().nullable(),
    }),
  ),
  monthlyFee: z.object({
    amount: z.number().nonnegative(),
    startDate: z.string(),
    status: z.enum(['ATIVO', 'SUSPENSO', 'ENCERRADO']),
  }),
});

export type ClientInput = z.infer<typeof clientSchema>;
