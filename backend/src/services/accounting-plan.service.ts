import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client.js';

export type AccountPayload = {
  code: string;
  name: string;
  type: string;
  nature: string;
  classification: string;
  level?: number;
  parentId?: string | null;
  allowsEntry?: boolean;
  usesCostCenter?: boolean;
  usesStdHistory?: boolean;
  integratesModules?: boolean;
  spedRefCode?: string | null;
  ecfRefCode?: string | null;
  notes?: string | null;
  active?: boolean;
};

// ── Listagem em árvore ────────────────────────────────────────────────────────

export async function listAccounts(clientId: string, classification?: string) {
  return prisma.accountingPlan.findMany({
    where: {
      clientId,
      ...(classification ? { classification: classification as never } : {}),
    },
    include: { parent: { select: { id: true, code: true, name: true } } },
    orderBy: { code: 'asc' },
  });
}

export async function getAccount(id: string) {
  return prisma.accountingPlan.findUniqueOrThrow({
    where: { id },
    include: {
      parent: { select: { id: true, code: true, name: true } },
      children: { select: { id: true, code: true, name: true, type: true, active: true }, orderBy: { code: 'asc' } },
    },
  });
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function createAccount(clientId: string, data: AccountPayload) {
  // Calcula nível a partir do código (separador ".")
  const level = data.level ?? data.code.split('.').length;

  // Se informou parentId, verifica que é SINTETICA
  if (data.parentId) {
    const parent = await prisma.accountingPlan.findUnique({ where: { id: data.parentId } });
    if (parent && parent.type === 'ANALITICA') {
      throw new Error('Conta analítica não pode ser pai de outra conta.');
    }
  }

  return prisma.accountingPlan.create({
    data: {
      clientId,
      code: data.code,
      name: data.name,
      type: data.type as never,
      nature: data.nature as never,
      classification: data.classification as never,
      level,
      parentId: data.parentId,
      allowsEntry: data.allowsEntry ?? data.type === 'ANALITICA',
      usesCostCenter: data.usesCostCenter ?? false,
      usesStdHistory: data.usesStdHistory ?? false,
      integratesModules: data.integratesModules ?? false,
      spedRefCode: data.spedRefCode,
      ecfRefCode: data.ecfRefCode,
      notes: data.notes,
      active: data.active ?? true,
    },
  });
}

export async function updateAccount(id: string, data: Partial<AccountPayload>) {
  const level = data.code ? data.code.split('.').length : undefined;
  return prisma.accountingPlan.update({
    where: { id },
    data: {
      ...data,
      ...(level !== undefined ? { level } : {}),
      type: data.type as never,
      nature: data.nature as never,
      classification: data.classification as never,
    },
  });
}

export async function deleteAccount(id: string) {
  const children = await prisma.accountingPlan.count({ where: { parentId: id } });
  if (children > 0) throw new Error('Conta com filhas não pode ser excluída.');
  return prisma.accountingPlan.delete({ where: { id } });
}

// ── Importação de plano padrão ────────────────────────────────────────────────

const DEFAULT_ACCOUNTS: Omit<AccountPayload, 'level'>[] = [
  // ATIVO
  { code: '1',         name: 'ATIVO',                             type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: false },
  { code: '1.1',       name: 'ATIVO CIRCULANTE',                  type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: false },
  { code: '1.1.1',     name: 'Disponibilidades',                  type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: false },
  { code: '1.1.1.01',  name: 'Caixa',                             type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: true  },
  { code: '1.1.1.02',  name: 'Bancos Conta Movimento',            type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: true  },
  { code: '1.1.2',     name: 'Créditos',                          type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: false },
  { code: '1.1.2.01',  name: 'Clientes',                          type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: true  },
  { code: '1.1.2.02',  name: 'Duplicatas a Receber',              type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: true  },
  { code: '1.1.3',     name: 'Estoques',                          type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: false },
  { code: '1.1.3.01',  name: 'Estoque de Mercadorias',            type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: true  },
  { code: '1.1.4',     name: 'Impostos a Recuperar',              type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: false },
  { code: '1.1.4.01',  name: 'ICMS a Recuperar',                  type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: true  },
  { code: '1.1.4.02',  name: 'PIS a Recuperar',                   type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: true  },
  { code: '1.1.4.03',  name: 'COFINS a Recuperar',                type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: true  },
  { code: '1.2',       name: 'ATIVO NÃO CIRCULANTE',              type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: false },
  { code: '1.2.1',     name: 'Imobilizado',                       type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: false },
  { code: '1.2.1.01',  name: 'Móveis e Utensílios',               type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: true  },
  { code: '1.2.1.02',  name: 'Equipamentos de Informática',       type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'ATIVO',              allowsEntry: true  },
  { code: '1.2.1.90',  name: '(-) Depreciação Acumulada',         type: 'ANALITICA', nature: 'CREDORA',   classification: 'ATIVO',              allowsEntry: true  },
  // PASSIVO
  { code: '2',         name: 'PASSIVO',                           type: 'SINTETICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: false },
  { code: '2.1',       name: 'PASSIVO CIRCULANTE',                type: 'SINTETICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: false },
  { code: '2.1.1',     name: 'Fornecedores',                      type: 'SINTETICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: false },
  { code: '2.1.1.01',  name: 'Fornecedores Nacionais',            type: 'ANALITICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: true  },
  { code: '2.1.2',     name: 'Obrigações Fiscais',                type: 'SINTETICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: false },
  { code: '2.1.2.01',  name: 'ICMS a Recolher',                   type: 'ANALITICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: true  },
  { code: '2.1.2.02',  name: 'PIS a Recolher',                    type: 'ANALITICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: true  },
  { code: '2.1.2.03',  name: 'COFINS a Recolher',                 type: 'ANALITICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: true  },
  { code: '2.1.2.04',  name: 'ISS a Recolher',                    type: 'ANALITICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: true  },
  { code: '2.1.2.05',  name: 'IRPJ a Recolher',                   type: 'ANALITICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: true  },
  { code: '2.1.3',     name: 'Obrigações Trabalhistas',           type: 'SINTETICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: false },
  { code: '2.1.3.01',  name: 'Salários a Pagar',                  type: 'ANALITICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: true  },
  { code: '2.1.3.02',  name: 'FGTS a Recolher',                   type: 'ANALITICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: true  },
  { code: '2.1.3.03',  name: 'INSS a Recolher',                   type: 'ANALITICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: true  },
  { code: '2.1.3.04',  name: 'Provisão Férias',                   type: 'ANALITICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: true  },
  { code: '2.1.3.05',  name: 'Provisão 13º Salário',              type: 'ANALITICA', nature: 'CREDORA',   classification: 'PASSIVO',            allowsEntry: true  },
  // PATRIMÔNIO LÍQUIDO
  { code: '3',         name: 'PATRIMÔNIO LÍQUIDO',                type: 'SINTETICA', nature: 'CREDORA',   classification: 'PATRIMONIO_LIQUIDO', allowsEntry: false },
  { code: '3.1',       name: 'Capital Social',                    type: 'SINTETICA', nature: 'CREDORA',   classification: 'PATRIMONIO_LIQUIDO', allowsEntry: false },
  { code: '3.1.1.01',  name: 'Capital Social Subscrito',          type: 'ANALITICA', nature: 'CREDORA',   classification: 'PATRIMONIO_LIQUIDO', allowsEntry: true  },
  { code: '3.2',       name: 'Reservas e Resultados',             type: 'SINTETICA', nature: 'CREDORA',   classification: 'PATRIMONIO_LIQUIDO', allowsEntry: false },
  { code: '3.2.1.01',  name: 'Lucros Acumulados',                 type: 'ANALITICA', nature: 'CREDORA',   classification: 'PATRIMONIO_LIQUIDO', allowsEntry: true  },
  { code: '3.2.1.02',  name: 'Prejuízos Acumulados',              type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'PATRIMONIO_LIQUIDO', allowsEntry: true  },
  // RECEITAS
  { code: '4',         name: 'RECEITAS',                          type: 'SINTETICA', nature: 'CREDORA',   classification: 'RECEITA',            allowsEntry: false },
  { code: '4.1',       name: 'Receitas Operacionais',             type: 'SINTETICA', nature: 'CREDORA',   classification: 'RECEITA',            allowsEntry: false },
  { code: '4.1.1.01',  name: 'Receita de Vendas de Mercadorias', type: 'ANALITICA', nature: 'CREDORA',   classification: 'RECEITA',            allowsEntry: true  },
  { code: '4.1.1.02',  name: 'Receita de Prestação de Serviços', type: 'ANALITICA', nature: 'CREDORA',   classification: 'RECEITA',            allowsEntry: true  },
  { code: '4.1.2',     name: 'Deduções da Receita',               type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'RECEITA',            allowsEntry: false },
  { code: '4.1.2.01',  name: 'Devoluções de Vendas',              type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'RECEITA',            allowsEntry: true  },
  { code: '4.1.2.02',  name: 'Impostos sobre Vendas',             type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'RECEITA',            allowsEntry: true  },
  // CUSTOS
  { code: '5',         name: 'CUSTOS',                            type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'CUSTO',              allowsEntry: false },
  { code: '5.1',       name: 'Custo das Mercadorias Vendidas',    type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'CUSTO',              allowsEntry: false },
  { code: '5.1.1.01',  name: 'CMV — Mercadorias',                 type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'CUSTO',              allowsEntry: true  },
  { code: '5.2',       name: 'Custo dos Serviços Prestados',      type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'CUSTO',              allowsEntry: false },
  { code: '5.2.1.01',  name: 'CSP — Serviços',                    type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'CUSTO',              allowsEntry: true  },
  // DESPESAS
  { code: '6',         name: 'DESPESAS',                          type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: false },
  { code: '6.1',       name: 'Despesas Administrativas',          type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: false },
  { code: '6.1.1.01',  name: 'Salários e Ordenados',              type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: true, usesCostCenter: true },
  { code: '6.1.1.02',  name: 'Encargos Sociais',                  type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: true, usesCostCenter: true },
  { code: '6.1.1.03',  name: 'Aluguel',                           type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: true  },
  { code: '6.1.1.04',  name: 'Energia Elétrica',                  type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: true  },
  { code: '6.1.1.05',  name: 'Telefone e Internet',               type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: true  },
  { code: '6.1.1.06',  name: 'Honorários Contábeis',              type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: true  },
  { code: '6.1.1.07',  name: 'Depreciações e Amortizações',       type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: true  },
  { code: '6.2',       name: 'Despesas Financeiras',              type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: false },
  { code: '6.2.1.01',  name: 'Juros Passivos',                    type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: true  },
  { code: '6.2.1.02',  name: 'Multas e Encargos',                 type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'DESPESA',            allowsEntry: true  },
  // RESULTADO
  { code: '7',         name: 'APURAÇÃO DO RESULTADO',             type: 'SINTETICA', nature: 'DEVEDORA',  classification: 'RESULTADO',          allowsEntry: false },
  { code: '7.1.1.01',  name: 'Resultado do Exercício',            type: 'ANALITICA', nature: 'DEVEDORA',  classification: 'RESULTADO',          allowsEntry: true  },
];

export async function importDefaultPlan(clientId: string) {
  const existing = await prisma.accountingPlan.count({ where: { clientId } });
  if (existing > 0) throw new Error('Já existe plano de contas cadastrado para este cliente.');

  // Cria em lote usando createMany
  await prisma.accountingPlan.createMany({
    data: DEFAULT_ACCOUNTS.map((a) => ({
      clientId,
      code: a.code,
      name: a.name,
      type: a.type as never,
      nature: a.nature as never,
      classification: a.classification as never,
      level: a.code.split('.').length,
      allowsEntry: a.allowsEntry ?? false,
      usesCostCenter: a.usesCostCenter ?? false,
      usesStdHistory: a.usesStdHistory ?? false,
      integratesModules: false,
      active: true,
    })),
    skipDuplicates: true,
  });

  // Segunda passagem: ligar parentId pelo prefixo do código
  const all = await prisma.accountingPlan.findMany({ where: { clientId }, select: { id: true, code: true } });
  const byCode = Object.fromEntries(all.map((a) => [a.code, a.id]));

  for (const acc of all) {
    const parts = acc.code.split('.');
    if (parts.length <= 1) continue;
    // Tenta do nível mais próximo ao mais distante
    for (let i = parts.length - 1; i >= 1; i--) {
      const parentCode = parts.slice(0, i).join('.');
      if (byCode[parentCode]) {
        await prisma.accountingPlan.update({ where: { id: acc.id }, data: { parentId: byCode[parentCode] } });
        break;
      }
    }
    // Se tem 2+ partes mas pai direto não existe, torna sintética aquela pai inexistente sintética
    if (parts.length > 2) {
      const parentCode = parts.slice(0, -1).join('.');
      if (!byCode[parentCode]) {
        // o pai deve ser sintética do nível anterior já ligado
      }
    }
  }

  return prisma.accountingPlan.count({ where: { clientId } });
}
