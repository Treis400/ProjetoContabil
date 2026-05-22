import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import {
  CompanyStatus,
  CompanyType,
  ContractStatus,
  DocumentEntityType,
  PaymentMethod,
  PaymentStatus,
  PendingIssueType,
  Prisma,
  PrismaClient,
  PriorityLevel,
  ProcessStatus,
  ProcessType,
  StepStatus,
  TaxReviewStatus,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();
const currentYear = new Date().getFullYear();

const flowTemplates = [
  {
    name: 'Fluxo de Abertura de Empresa',
    type: ProcessType.ABERTURA_EMPRESA,
    steps: [
      'Conversa Inicial',
      'Analise de Nome Empresarial',
      'Definicao de CNAE',
      'Definicao de Regime Tributario',
      'Viabilidade Junta Comercial',
      'DBE',
      'Contrato Social',
      'Envio para Assinatura',
      'Registro Junta Comercial',
      'Prefeitura',
      'Estado',
      'Orgao Regulador',
      'Opcao pelo Simples Nacional',
      'Finalizacao',
    ],
  },
  {
    name: 'Fluxo de Alteracao de Empresa',
    type: ProcessType.ALTERACAO_EMPRESA,
    steps: [
      'Solicitacao do Cliente',
      'Analise da Alteracao',
      'Viabilidade Junta Comercial',
      'DBE',
      'Emissao de Documentos',
      'Envio para Assinatura',
      'Registro Junta Comercial',
      'Prefeitura',
      'Estado',
      'Orgao Regulador',
      'Atualizacao de Cadastros',
      'Finalizacao',
    ],
  },
  {
    name: 'Fluxo de Encerramento de Empresa',
    type: ProcessType.ENCERRAMENTO_EMPRESA,
    steps: [
      'Solicitacao de Encerramento pelo Cliente',
      'Analise da Situacao da Empresa',
      'Levantamento de Pendencias Fiscais e Tributarias',
      'Regularizacao de Pendencias',
      'Emissao de Certidoes Necessarias',
      'Elaboracao do Distrato Social/Requerimento',
      'Viabilidade Junta Comercial',
      'DBE de Baixa',
      'Emissao de Documentos',
      'Envio para Assinatura',
      'Registro na Junta Comercial',
      'Baixa Receita Federal',
      'Baixa Estadual',
      'Baixa Municipal',
      'Baixa em Orgao Regulador',
      'Cancelamento de Inscricoes e Licencas',
      'Conferencia Final',
      'Finalizacao do Processo',
    ],
  },
];

const demoEmployees = [
  {
    name: 'Fernanda Lima',
    email: 'fernanda@contabil.local',
    role: UserRole.EMPLOYEE,
  },
  {
    name: 'Gabriel Rocha',
    email: 'gabriel@contabil.local',
    role: UserRole.EMPLOYEE,
  },
  {
    name: 'Mariana Souza',
    email: 'mariana@contabil.local',
    role: UserRole.EMPLOYEE,
  },
];

const demoClients = [
  {
    companyName: 'Alfa Comercio de Utilidades Ltda',
    tradeName: 'Casa Alfa',
    cnpj: '12345678000101',
    companyStatus: CompanyStatus.ATIVA,
    companyType: CompanyType.SIMPLES_NACIONAL,
    currentTaxSituation: TaxReviewStatus.SIMPLES_NACIONAL_ATIVO,
    taxRegime: 'Simples Nacional',
    services: ['CONTABILIDADE_REGULAR', 'FISCAL'],
    monthlyFeeAmount: 480,
    monthlyFeeStatus: ContractStatus.ATIVO,
    certificateDaysFromNow: 4,
    taxReviewStatus: TaxReviewStatus.SIMPLES_NACIONAL_ATIVO,
    taxReviewNotes: 'Empresa regular e sem apontamentos.',
  },
  {
    companyName: 'Beta Servicos Digitais Ltda',
    tradeName: 'Beta Cloud',
    cnpj: '12345678000102',
    companyStatus: CompanyStatus.ATIVA,
    companyType: CompanyType.LUCRO_PRESUMIDO,
    currentTaxSituation: TaxReviewStatus.LUCRO_PRESUMIDO,
    taxRegime: 'Lucro Presumido',
    services: ['ASSESSORIA', 'IMPOSTO_RENDA'],
    monthlyFeeAmount: 720,
    monthlyFeeStatus: ContractStatus.ATIVO,
    certificateDaysFromNow: 40,
    taxReviewStatus: TaxReviewStatus.LUCRO_PRESUMIDO,
    taxReviewNotes: 'Mudanca de regime concluida este ano.',
  },
  {
    companyName: 'Clinica Gama Saude Integrada',
    tradeName: 'Clinica Gama',
    cnpj: '12345678000103',
    companyStatus: CompanyStatus.ATIVA,
    companyType: CompanyType.LUCRO_REAL,
    currentTaxSituation: TaxReviewStatus.LUCRO_REAL,
    taxRegime: 'Lucro Real',
    services: ['CONTABILIDADE_REGULAR', 'DEPARTAMENTO_PESSOAL'],
    monthlyFeeAmount: 980,
    monthlyFeeStatus: ContractStatus.ATIVO,
    certificateDaysFromNow: 18,
    taxReviewStatus: TaxReviewStatus.LUCRO_REAL,
    taxReviewNotes: 'Operacao maior, acompanhada mensalmente.',
  },
  {
    companyName: 'Delta Oficina Mecanica Ltda',
    tradeName: 'Oficina Delta',
    cnpj: '12345678000104',
    companyStatus: CompanyStatus.ATIVA,
    companyType: CompanyType.SIMPLES_NACIONAL,
    currentTaxSituation: TaxReviewStatus.SIMPLES_NACIONAL_EXCLUIDO,
    taxRegime: 'Simples Nacional',
    services: ['FISCAL', 'DEPARTAMENTO_PESSOAL'],
    monthlyFeeAmount: 560,
    monthlyFeeStatus: ContractStatus.SUSPENSO,
    certificateDaysFromNow: 2,
    taxReviewStatus: TaxReviewStatus.SIMPLES_NACIONAL_EXCLUIDO,
    taxReviewNotes: 'Recebeu notificacao de exclusao do simples.',
  },
  {
    companyName: 'Epsilon Studio Criativo Ltda',
    tradeName: 'Studio Epsilon',
    cnpj: '12345678000105',
    companyStatus: CompanyStatus.ATIVA,
    companyType: CompanyType.MEI,
    currentTaxSituation: TaxReviewStatus.MEI_ATIVO,
    taxRegime: 'MEI',
    services: ['MEI', 'IMPOSTO_RENDA'],
    monthlyFeeAmount: 180,
    monthlyFeeStatus: ContractStatus.ATIVO,
    certificateDaysFromNow: null,
    taxReviewStatus: TaxReviewStatus.MEI_ATIVO,
    taxReviewNotes: 'MEI ativo e faturamento dentro do limite.',
  },
  {
    companyName: 'Farmacia Zeta Popular Ltda',
    tradeName: 'Farmacia Zeta',
    cnpj: '12345678000106',
    companyStatus: CompanyStatus.ATIVA,
    companyType: CompanyType.MEI,
    currentTaxSituation: TaxReviewStatus.MEI_DESENQUADRADO,
    taxRegime: 'MEI',
    services: ['MEI', 'ASSESSORIA'],
    monthlyFeeAmount: 210,
    monthlyFeeStatus: ContractStatus.ATIVO,
    certificateDaysFromNow: null,
    taxReviewStatus: TaxReviewStatus.MEI_DESENQUADRADO,
    taxReviewNotes: 'Desenquadramento por excesso de faturamento.',
  },
  {
    companyName: 'Hotel Horizonte Ltda',
    tradeName: 'Hotel Horizonte',
    cnpj: '12345678000107',
    companyStatus: CompanyStatus.SUSPENSA,
    companyType: CompanyType.SIMPLES_NACIONAL,
    currentTaxSituation: TaxReviewStatus.SIMPLES_NACIONAL_ATIVO,
    taxRegime: 'Simples Nacional',
    services: ['CONTABILIDADE_REGULAR', 'FISCAL', 'DEPARTAMENTO_PESSOAL'],
    monthlyFeeAmount: 1250,
    monthlyFeeStatus: ContractStatus.SUSPENSO,
    certificateDaysFromNow: 10,
    taxReviewStatus: null,
    taxReviewNotes: null,
  },
  {
    companyName: 'Industria Iota Embalagens Ltda',
    tradeName: 'Iota Pack',
    cnpj: '12345678000108',
    companyStatus: CompanyStatus.ATIVA,
    companyType: CompanyType.LUCRO_PRESUMIDO,
    currentTaxSituation: TaxReviewStatus.LUCRO_PRESUMIDO,
    taxRegime: 'Lucro Presumido',
    services: ['FISCAL', 'ABERTURA_EMPRESA'],
    monthlyFeeAmount: 830,
    monthlyFeeStatus: ContractStatus.ATIVO,
    certificateDaysFromNow: 6,
    taxReviewStatus: TaxReviewStatus.LUCRO_PRESUMIDO,
    taxReviewNotes: 'Revisao concluida com manutencao do regime.',
  },
  {
    companyName: 'Jota Transportes e Logistica Ltda',
    tradeName: 'Jota Cargo',
    cnpj: '12345678000109',
    companyStatus: CompanyStatus.INATIVA,
    companyType: CompanyType.LUCRO_REAL,
    currentTaxSituation: TaxReviewStatus.LUCRO_REAL,
    taxRegime: 'Lucro Real',
    services: ['ENCERRAMENTO_EMPRESA', 'FISCAL'],
    monthlyFeeAmount: 690,
    monthlyFeeStatus: ContractStatus.ENCERRADO,
    certificateDaysFromNow: null,
    taxReviewStatus: null,
    taxReviewNotes: null,
  },
  {
    companyName: 'Kappa Educacao e Treinamentos Ltda',
    tradeName: 'Kappa Cursos',
    cnpj: '12345678000110',
    companyStatus: CompanyStatus.ENCERRADA,
    companyType: CompanyType.SIMPLES_NACIONAL,
    currentTaxSituation: TaxReviewStatus.SIMPLES_NACIONAL_ATIVO,
    taxRegime: 'Simples Nacional',
    services: ['ASSESSORIA', 'ALTERACAO_CONTRATUAL'],
    monthlyFeeAmount: 340,
    monthlyFeeStatus: ContractStatus.ENCERRADO,
    certificateDaysFromNow: null,
    taxReviewStatus: TaxReviewStatus.SIMPLES_NACIONAL_ATIVO,
    taxReviewNotes: 'Ultima revisao antes do encerramento formal.',
  },
] as const;

function addDays(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value;
}

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

function numericSuffix(value: string) {
  return value.slice(-4);
}

function getDocumentStoragePath(fileName: string) {
  return path.join('uploads', 'demo', fileName);
}

async function ensureDemoFile(fileName: string, content: string) {
  const uploadsDirectory = path.join(process.cwd(), 'uploads', 'demo');
  const fullPath = path.join(uploadsDirectory, fileName);

  await fs.mkdir(uploadsDirectory, { recursive: true });
  await fs.writeFile(fullPath, content, 'utf8');

  return {
    fileName,
    storagePath: getDocumentStoragePath(fileName),
    mimeType: 'text/plain',
    size: Buffer.byteLength(content, 'utf8'),
  };
}

async function upsertDemoEmployees() {
  const employeePassword = await bcrypt.hash('Colaborador@123', 10);

  for (const employee of demoEmployees) {
    await prisma.user.upsert({
      where: { email: employee.email },
      update: {
        name: employee.name,
        role: employee.role,
        active: true,
      },
      create: {
        name: employee.name,
        email: employee.email,
        passwordHash: employeePassword,
        role: employee.role,
        active: true,
      },
    });
  }
}

async function upsertFlowTemplates() {
  for (const template of flowTemplates) {
    const existing = await prisma.processFlowTemplate.findFirst({
      where: { type: template.type, isDefault: true },
    });

    if (existing) {
      continue;
    }

    await prisma.processFlowTemplate.create({
      data: {
        name: template.name,
        type: template.type,
        isDefault: true,
        steps: {
          create: template.steps.map((title, index) => ({
            title,
            orderIndex: index + 1,
          })),
        },
      },
    });
  }
}

async function resetDemoData() {
  const demoCnpjs = demoClients.map((client) => client.cnpj);
  const demoClientIds = await prisma.client.findMany({
    where: { cnpj: { in: demoCnpjs } },
    select: { id: true },
  });
  const ids = demoClientIds.map((client) => client.id);

  if (ids.length) {
    await prisma.client.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }
}

async function createDemoClients(adminId: string) {
  const createdClients: Array<{
    id: string;
    companyName: string;
    cnpj: string;
    companyType: CompanyType;
  }> = [];

  for (const client of demoClients) {
    const created = await prisma.client.create({
      data: {
        companyName: client.companyName,
        tradeName: client.tradeName,
        cnpj: client.cnpj,
        stateRegistration: `${numericSuffix(client.cnpj)}-IE`,
        municipalRegistration: `${numericSuffix(client.cnpj)}-IM`,
        mainCnae: '6201-5/01',
        taxRegime: client.taxRegime,
        openingDate: addDays(-800),
        companyStatus: client.companyStatus,
        legalRepresentative: `Responsavel ${client.tradeName}`,
        legalRepresentativeCpf: `0000000${numericSuffix(client.cnpj)}`.slice(0, 11),
        phone: '(11) 3000-0000',
        whatsapp: '(11) 98888-0000',
        email: `${client.tradeName.toLowerCase().replace(/\s+/g, '-') }@demo.contabil.local`,
        fullAddress: `Rua Demo ${numericSuffix(client.cnpj)}, Centro, Sao Paulo - SP`,
        internalNotes: `Cadastro de demonstracao para ${client.tradeName}.`,
        createdById: adminId,
        updatedById: adminId,
        taxProfile: {
          create: {
            companyType: client.companyType,
            cityHall: 'Prefeitura Municipal de Sao Paulo',
            regulatoryAgency: client.companyType === CompanyType.LUCRO_REAL ? 'Anvisa' : 'Junta Comercial',
            digitalCertificate: client.certificateDaysFromNow !== null ? `CERT-${numericSuffix(client.cnpj)}` : null,
            digitalCertificateExpiry:
              client.certificateDaysFromNow !== null ? addDays(client.certificateDaysFromNow) : null,
            currentTaxSituation: client.currentTaxSituation,
          },
        },
        services: {
          create: client.services.map((serviceType) => ({
            serviceType,
            description: `Servico de ${serviceType.toLowerCase().replace(/_/g, ' ')} para testes.`,
          })),
        },
        monthlyFees: {
          create: {
            amount: toDecimal(client.monthlyFeeAmount),
            startDate: addDays(-365),
            status: client.monthlyFeeStatus,
            isCurrent: true,
            adjustments: {
              create: {
                previousAmount: toDecimal(Math.max(client.monthlyFeeAmount - 40, 120)),
                newAmount: toDecimal(client.monthlyFeeAmount),
                effectiveDate: addDays(-90),
                notes: 'Reajuste demonstrativo anual.',
              },
            },
          },
        },
        changeLogs: {
          create: {
            userId: adminId,
            fieldName: 'cadastro',
            oldValue: null,
            newValue: 'Cliente fake criado para testes do sistema.',
          },
        },
      },
      select: {
        id: true,
        companyName: true,
        cnpj: true,
        taxProfile: {
          select: {
            companyType: true,
          },
        },
      },
    });

    createdClients.push({
      id: created.id,
      companyName: created.companyName,
      cnpj: created.cnpj,
      companyType: created.taxProfile!.companyType,
    });
  }

  return createdClients;
}

async function createDemoTaxReviews(clientIdsByCnpj: Map<string, string>, reviewedById: string) {
  for (const client of demoClients) {
    if (!client.taxReviewStatus) {
      continue;
    }

    await prisma.taxAnnualReview.create({
      data: {
        clientId: clientIdsByCnpj.get(client.cnpj)!,
        year: currentYear,
        status: client.taxReviewStatus,
        verificationDate: addDays(-15),
        notes: client.taxReviewNotes,
        reviewedById,
      },
    });
  }
}

async function createDemoProcesses(
  clientIdsByCnpj: Map<string, string>,
  employeeIds: string[],
  adminId: string,
) {
  type DemoProcessDefinition = {
    clientCnpj: string;
    title: string;
    type: ProcessType;
    status: ProcessStatus;
    priority: PriorityLevel;
    dueInDays: number;
    responsibleId: string;
    fee: {
      totalAmount: number;
      paymentStatus: PaymentStatus;
      paymentMethod: PaymentMethod;
    };
    documentLabel: string;
    stepStatuses: StepStatus[];
    pendingIssues?: Array<{
      type: PendingIssueType;
      description: string;
    }>;
    closureData?: {
      protocolNumber: string;
      finalNotes: string;
    };
  };

  const templates = await prisma.processFlowTemplate.findMany({
    where: { isDefault: true },
    include: {
      steps: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  const templateByType = new Map(templates.map((template) => [template.type, template]));

  const processDefinitions: DemoProcessDefinition[] = [
    {
      clientCnpj: '12345678000101',
      title: 'DEMO: Abertura filial Casa Alfa',
      type: ProcessType.ABERTURA_EMPRESA,
      status: ProcessStatus.ESCRITORIO_EXECUTANDO,
      priority: PriorityLevel.ALTA,
      dueInDays: 5,
      responsibleId: employeeIds[0],
      fee: { totalAmount: 1800, paymentStatus: PaymentStatus.PENDENTE, paymentMethod: PaymentMethod.PIX },
      documentLabel: 'Checklist abertura filial',
      stepStatuses: [StepStatus.CONCLUIDO, StepStatus.EM_ANDAMENTO, StepStatus.PENDENTE],
    },
    {
      clientCnpj: '12345678000102',
      title: 'DEMO: Alteracao contratual Beta Cloud',
      type: ProcessType.ALTERACAO_EMPRESA,
      status: ProcessStatus.ESCRITORIO_EXECUTANDO,
      priority: PriorityLevel.MEDIA,
      dueInDays: 2,
      responsibleId: employeeIds[1],
      fee: { totalAmount: 950, paymentStatus: PaymentStatus.PARCIAL, paymentMethod: PaymentMethod.BOLETO },
      documentLabel: 'Minuta alteracao contratual',
      stepStatuses: [StepStatus.CONCLUIDO, StepStatus.CONCLUIDO, StepStatus.EM_ANDAMENTO],
    },
    {
      clientCnpj: '12345678000103',
      title: 'DEMO: Revisao fiscal Clinica Gama',
      type: ProcessType.FISCAL,
      status: ProcessStatus.CONCLUIDO,
      priority: PriorityLevel.BAIXA,
      dueInDays: -12,
      responsibleId: employeeIds[2],
      fee: { totalAmount: 650, paymentStatus: PaymentStatus.PAGO, paymentMethod: PaymentMethod.TRANSFERENCIA },
      documentLabel: 'Relatorio revisao fiscal',
      stepStatuses: [],
    },
    {
      clientCnpj: '12345678000104',
      title: 'DEMO: Regularizacao exclusao do simples',
      type: ProcessType.FISCAL,
      status: ProcessStatus.PARADO_COM_CLIENTE,
      priority: PriorityLevel.URGENTE,
      dueInDays: -3,
      responsibleId: employeeIds[0],
      fee: { totalAmount: 1400, paymentStatus: PaymentStatus.PENDENTE, paymentMethod: PaymentMethod.PIX },
      documentLabel: 'Notificacao exclusao simples',
      stepStatuses: [],
    },
    {
      clientCnpj: '12345678000105',
      title: 'DEMO: Declaracao anual MEI Epsilon',
      type: ProcessType.IMPOSTO_RENDA,
      status: ProcessStatus.ESCRITORIO_EXECUTANDO,
      priority: PriorityLevel.MEDIA,
      dueInDays: 6,
      responsibleId: employeeIds[1],
      fee: { totalAmount: 220, paymentStatus: PaymentStatus.PAGO, paymentMethod: PaymentMethod.DINHEIRO },
      documentLabel: 'Comprovante DASN-SIMEI',
      stepStatuses: [],
    },
    {
      clientCnpj: '12345678000106',
      title: 'DEMO: Transicao de MEI para LTDA',
      type: ProcessType.ALTERACAO_EMPRESA,
      status: ProcessStatus.ESCRITORIO_EXECUTANDO,
      priority: PriorityLevel.ALTA,
      dueInDays: 8,
      responsibleId: employeeIds[2],
      fee: { totalAmount: 2500, paymentStatus: PaymentStatus.PARCIAL, paymentMethod: PaymentMethod.PIX },
      documentLabel: 'Planejamento desenquadramento',
      stepStatuses: [StepStatus.CONCLUIDO, StepStatus.EM_ANDAMENTO, StepStatus.PENDENTE],
    },
    {
      clientCnpj: '12345678000107',
      title: 'DEMO: Renovacao certificado Hotel Horizonte',
      type: ProcessType.OUTRO,
      status: ProcessStatus.PARADO_COM_CLIENTE,
      priority: PriorityLevel.ALTA,
      dueInDays: 1,
      responsibleId: employeeIds[0],
      fee: { totalAmount: 380, paymentStatus: PaymentStatus.PENDENTE, paymentMethod: PaymentMethod.CARTAO_CREDITO },
      documentLabel: 'Proposta renovacao certificado',
      stepStatuses: [],
    },
    {
      clientCnpj: '12345678000108',
      title: 'DEMO: Abertura nova unidade Iota Pack',
      type: ProcessType.ABERTURA_EMPRESA,
      status: ProcessStatus.ESCRITORIO_EXECUTANDO,
      priority: PriorityLevel.MEDIA,
      dueInDays: 14,
      responsibleId: employeeIds[1],
      fee: { totalAmount: 3200, paymentStatus: PaymentStatus.PARCIAL, paymentMethod: PaymentMethod.BOLETO },
      documentLabel: 'Checklist abertura unidade',
      stepStatuses: [StepStatus.CONCLUIDO, StepStatus.EM_ANDAMENTO, StepStatus.PENDENTE],
    },
    {
      clientCnpj: '12345678000109',
      title: 'DEMO: Encerramento Jota Cargo',
      type: ProcessType.ENCERRAMENTO_EMPRESA,
      status: ProcessStatus.PARADO_COM_CLIENTE,
      priority: PriorityLevel.URGENTE,
      dueInDays: -9,
      responsibleId: employeeIds[2],
      fee: { totalAmount: 2100, paymentStatus: PaymentStatus.PENDENTE, paymentMethod: PaymentMethod.TRANSFERENCIA },
      documentLabel: 'Distrato social preliminar',
      stepStatuses: [StepStatus.CONCLUIDO, StepStatus.AGUARDANDO_CLIENTE, StepStatus.PENDENTE],
      pendingIssues: [
        {
          type: PendingIssueType.DEBITO_TRIBUTARIO,
          description: 'Debitos de ISS ainda nao regularizados.',
        },
        {
          type: PendingIssueType.FALTA_DOCUMENTO,
          description: 'Cliente nao enviou comprovante de baixa municipal.',
        },
      ],
      closureData: {
        protocolNumber: 'PROTO-DEMO-9001',
        finalNotes: 'Aguardando retorno do cliente para concluir.',
      },
    },
    {
      clientCnpj: '12345678000110',
      title: 'DEMO: Organizacao arquivo Kappa Cursos',
      type: ProcessType.OUTRO,
      status: ProcessStatus.CONCLUIDO,
      priority: PriorityLevel.BAIXA,
      dueInDays: -30,
      responsibleId: employeeIds[1],
      fee: { totalAmount: 150, paymentStatus: PaymentStatus.PAGO, paymentMethod: PaymentMethod.PIX },
      documentLabel: 'Checklist arquivamento',
      stepStatuses: [],
    },
    {
      clientCnpj: '12345678000101',
      title: 'DEMO: Ajuste cadastral estadual Casa Alfa',
      type: ProcessType.ALTERACAO_EMPRESA,
      status: ProcessStatus.CONCLUIDO,
      priority: PriorityLevel.MEDIA,
      dueInDays: -4,
      responsibleId: employeeIds[2],
      fee: { totalAmount: 500, paymentStatus: PaymentStatus.PAGO, paymentMethod: PaymentMethod.PIX },
      documentLabel: 'Comprovante alteracao estadual',
      stepStatuses: [StepStatus.CONCLUIDO, StepStatus.CONCLUIDO, StepStatus.CONCLUIDO],
    },
    {
      clientCnpj: '12345678000104',
      title: 'DEMO: Parcelamento fiscal Delta',
      type: ProcessType.FISCAL,
      status: ProcessStatus.ESCRITORIO_EXECUTANDO,
      priority: PriorityLevel.URGENTE,
      dueInDays: -1,
      responsibleId: employeeIds[1],
      fee: { totalAmount: 890, paymentStatus: PaymentStatus.PARCIAL, paymentMethod: PaymentMethod.BOLETO },
      documentLabel: 'Simulacao parcelamento',
      stepStatuses: [],
    },
  ];

  const createdProcesses: Array<{ id: string; title: string; clientId: string }> = [];

  for (const definition of processDefinitions) {
    const template = templateByType.get(definition.type);
    const dueDate = addDays(definition.dueInDays);
    const process = await prisma.process.create({
      data: {
        clientId: clientIdsByCnpj.get(definition.clientCnpj)!,
        flowTemplateId: template?.id ?? null,
        title: definition.title,
        description: `Processo demonstrativo para ${definition.title.toLowerCase()}.`,
        type: definition.type,
        status: definition.status,
        priority: definition.priority,
        responsibleId: definition.responsibleId,
        dueDate,
        startedAt: addDays(-20),
        completedAt: definition.status === ProcessStatus.CONCLUIDO ? addDays(-2) : null,
        notes: 'Registro fake criado para validar as telas de listagem e detalhe.',
        closureEffectiveDate: definition.closureData ? addDays(12) : null,
        protocolNumber: definition.closureData?.protocolNumber ?? null,
        finalNotes: definition.closureData?.finalNotes ?? null,
        createdById: adminId,
        updatedById: adminId,
        steps: template
          ? {
              create: template.steps.slice(0, 4).map((step, index) => ({
                templateStepId: step.id,
                title: step.title,
                orderIndex: step.orderIndex,
                status: definition.stepStatuses[index] ?? StepStatus.PENDENTE,
                dueDate,
                completedAt:
                  definition.stepStatuses[index] === StepStatus.CONCLUIDO ? addDays(-index - 1) : null,
                notes: `Etapa demonstrativa ${index + 1}.`,
              })),
            }
          : undefined,
        movements: {
          create: [
            {
              userId: adminId,
              description: 'Processo criado para testes.',
              previousStatus: null,
              nextStatus: definition.status,
            },
            {
              userId: definition.responsibleId,
              description: `Responsavel atribuido ao processo ${definition.title}.`,
              previousStatus: definition.status,
              nextStatus: definition.status,
            },
          ],
        },
        pendingIssues: definition.pendingIssues
          ? {
              create: definition.pendingIssues,
            }
          : undefined,
        fee: {
          create: {
            totalAmount: toDecimal(definition.fee.totalAmount),
            paymentMethod: definition.fee.paymentMethod,
            installmentsCount: definition.fee.paymentStatus === PaymentStatus.PAGO ? 1 : 2,
            paymentStatus: definition.fee.paymentStatus,
            installments: {
              create:
                definition.fee.paymentStatus === PaymentStatus.PAGO
                  ? [
                      {
                        sequence: 1,
                        dueDate,
                        amount: toDecimal(definition.fee.totalAmount),
                        status: PaymentStatus.PAGO,
                        paidAt: addDays(-1),
                      },
                    ]
                  : [
                      {
                        sequence: 1,
                        dueDate,
                        amount: toDecimal(definition.fee.totalAmount / 2),
                        status: definition.fee.paymentStatus === PaymentStatus.PARCIAL ? PaymentStatus.PAGO : PaymentStatus.PENDENTE,
                        paidAt: definition.fee.paymentStatus === PaymentStatus.PARCIAL ? addDays(-2) : null,
                      },
                      {
                        sequence: 2,
                        dueDate: addDays(definition.dueInDays + 15),
                        amount: toDecimal(definition.fee.totalAmount / 2),
                        status: PaymentStatus.PENDENTE,
                        paidAt: null,
                      },
                    ],
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        clientId: true,
      },
    });

    createdProcesses.push(process);
  }

  return createdProcesses;
}

async function createDemoDocuments(
  clientIdsByCnpj: Map<string, string>,
  processes: Array<{ id: string; title: string; clientId: string }>,
  uploadedById: string,
) {
  for (const client of demoClients.slice(0, 6)) {
    const fileName = `cliente-${numericSuffix(client.cnpj)}.txt`;
    const file = await ensureDemoFile(
      fileName,
      `Documento de teste vinculado ao cliente ${client.companyName}.`,
    );

    await prisma.document.create({
      data: {
        originalName: `Ficha ${client.tradeName}.txt`,
        fileName: file.fileName,
        storagePath: file.storagePath,
        mimeType: file.mimeType,
        size: file.size,
        entityType: DocumentEntityType.CLIENT,
        clientId: clientIdsByCnpj.get(client.cnpj)!,
        uploadedById,
      },
    });
  }

  for (const process of processes.slice(0, 6)) {
    const fileName = `processo-${process.id}.txt`;
    const file = await ensureDemoFile(
      fileName,
      `Documento demonstrativo do processo ${process.title}.`,
    );

    await prisma.document.create({
      data: {
        originalName: `${process.title}.txt`,
        fileName: file.fileName,
        storagePath: file.storagePath,
        mimeType: file.mimeType,
        size: file.size,
        entityType: DocumentEntityType.PROCESS,
        clientId: process.clientId,
        processId: process.id,
        uploadedById,
      },
    });
  }
}

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@contabil.local' },
    update: {
      name: 'Administrador',
      role: UserRole.ADMIN,
      active: true,
    },
    create: {
      name: 'Administrador',
      email: 'admin@contabil.local',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  await upsertFlowTemplates();
  await upsertDemoEmployees();
  await resetDemoData();

  const employees = await prisma.user.findMany({
    where: {
      email: {
        in: demoEmployees.map((employee) => employee.email),
      },
    },
    orderBy: {
      email: 'asc',
    },
    select: {
      id: true,
      email: true,
    },
  });

  const demoClientRecords = await createDemoClients(admin.id);
  const clientIdsByCnpj = new Map(demoClientRecords.map((client) => [client.cnpj, client.id]));

  await createDemoTaxReviews(clientIdsByCnpj, admin.id);

  const processes = await createDemoProcesses(
    clientIdsByCnpj,
    employees.map((employee) => employee.id),
    admin.id,
  );

  await createDemoDocuments(clientIdsByCnpj, processes, admin.id);

  console.log(`Seed concluido com ${demoClientRecords.length} clientes fake e ${processes.length} processos.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed error', error);
    await prisma.$disconnect();
    process.exit(1);
  });
