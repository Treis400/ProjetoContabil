import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import {
  AccountClass,
  AccountNature,
  AccountType,
  AdjustmentType,
  ApurationStatus,
  BookType,
  CompanyStatus,
  CompanyType,
  ContractStatus,
  CostCenterType,
  DebitCredit,
  DocumentEntityType,
  EcfStatus,
  EntrySource,
  EntryStatus,
  EntryTypeClass,
  FiscalDocumentOrigin,
  FiscalDocumentStatus,
  FiscalDocumentType,
  FiscalEntryExit,
  IrpjCsllCalcStatus,
  LalurAdjustNature,
  LalurAdjustTiming,
  LalurAuditAction, // CREATE | UPDATE | DELETE | LOCK | UNLOCK | IMPORT
  LalurPartBControlType,
  LalurPartBMovType,
  LalurPartBType,
  ObligationStatus,
  ObligationType,
  PatrimonyAcquisitionType,
  PatrimonyAssetStatus,
  PatrimonyDeprecMethod,
  PatrimonyDisposalType,
  PatrimonyInventoryStatus,
  PatrimonyMovementType,
  PatrimonyRevaluationType,
  PaymentMethod,
  PaymentStatus,
  PendingIssueType,
  PeriodClosingStatus,
  Prisma,
  PrismaClient,
  PriorityLevel,
  ProcessStatus,
  ProcessType,
  StepStatus,
  TaxApurationType,
  TaxRegimeCalc,
  TaxReviewStatus,
  UserRole,
  ValidationStatus,
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

  await createDemoFiscalData(clientIdsByCnpj, admin.id);
  await createDemoAccountingData(clientIdsByCnpj, admin.id);
  await createDemoLalurData(clientIdsByCnpj, admin.id);
  await createDemoPatrimonyData(clientIdsByCnpj, admin.id);

  console.log(`Seed concluido com ${demoClientRecords.length} clientes fake e ${processes.length} processos.`);
}

// ── Fiscal ────────────────────────────────────────────────────────────────────

async function createDemoFiscalData(clientIdsByCnpj: Map<string, string>, adminId: string) {
  // Usar Clínica Gama (Lucro Real) e Alfa Comercio (Simples Nacional)
  const gamaId = clientIdsByCnpj.get('12345678000103')!;
  const alfaId = clientIdsByCnpj.get('12345678000101')!;
  const betaId = clientIdsByCnpj.get('12345678000102')!;

  // Produtos
  await prisma.fiscalProduct.createMany({
    skipDuplicates: true,
    data: [
      {
        clientId: alfaId,
        internalCode: 'PROD001',
        description: 'Caderno Universitário 200 fls',
        unitOfMeasure: 'UN',
        ncm: '48201000',
        cest: '1301100',
        group: 'Papelaria',
        cfopInbound: '1102',
        cfopOutbound: '5102',
        cstIcms: '00',
        cstPisCofins: '01',
        icmsInternalRate: 12,
        pisRate: 0.65,
        cofinsRate: 3,
        isForResale: true,
      },
      {
        clientId: alfaId,
        internalCode: 'PROD002',
        description: 'Caneta Esferográfica Azul cx/50',
        unitOfMeasure: 'CX',
        ncm: '96081010',
        group: 'Papelaria',
        cfopInbound: '1102',
        cfopOutbound: '5102',
        cstIcms: '00',
        cstPisCofins: '01',
        icmsInternalRate: 12,
        pisRate: 0.65,
        cofinsRate: 3,
        isForResale: true,
      },
      {
        clientId: alfaId,
        internalCode: 'PROD003',
        description: 'Mesa Escritório 1,20m',
        unitOfMeasure: 'UN',
        ncm: '94033000',
        group: 'Móveis',
        cfopInbound: '1102',
        cfopOutbound: '5102',
        cstIcms: '00',
        cstPisCofins: '70',
        icmsInternalRate: 12,
        pisRate: 0.65,
        cofinsRate: 3,
        isFixedAsset: true,
      },
    ],
  });

  // Serviços
  await prisma.fiscalService.createMany({
    skipDuplicates: true,
    data: [
      {
        clientId: gamaId,
        internalCode: 'SRV001',
        description: 'Consulta Médica Clínica Geral',
        municipalCode: '4.01',
        lc116Code: '4.01',
        issRate: 2,
        hasCsllRetention: true,
        hasPisRetention: true,
        hasCofinsRetention: true,
        hasIrrfRetention: true,
      },
      {
        clientId: gamaId,
        internalCode: 'SRV002',
        description: 'Exame Laboratorial',
        municipalCode: '4.02',
        lc116Code: '4.02',
        issRate: 2,
      },
      {
        clientId: betaId,
        internalCode: 'SRV001',
        description: 'Desenvolvimento de Software',
        municipalCode: '1.05',
        lc116Code: '1.05',
        issRate: 5,
        hasInssRetention: false,
        hasCsllRetention: true,
        hasPisRetention: true,
        hasCofinsRetention: true,
        hasIrrfRetention: true,
      },
      {
        clientId: betaId,
        internalCode: 'SRV002',
        description: 'Licenciamento de Software',
        municipalCode: '1.05',
        lc116Code: '1.05',
        issRate: 2,
      },
    ],
  });

  // Naturezas de operação
  await prisma.operationNature.createMany({
    skipDuplicates: true,
    data: [
      { clientId: alfaId, code: 'VDA', description: 'Venda de Mercadoria', cfop: '5102' },
      { clientId: alfaId, code: 'CMP', description: 'Compra para Revenda', cfop: '1102' },
      { clientId: alfaId, code: 'DEV', description: 'Devolução de Venda', cfop: '5202' },
      { clientId: gamaId, code: 'SRV', description: 'Prestação de Serviços Médicos', cfop: '5933' },
      { clientId: betaId, code: 'SRV', description: 'Prestação de Serviços de TI', cfop: '5933' },
    ],
  });

  // NF-e e NFS-e com todos os status (usando clientId flat para compatibilidade com createMany)
  const docsNfe: Prisma.FiscalDocumentCreateManyInput[] = [
    {
      clientId: alfaId,
      documentType: 'NF_E' as any,
      entryExit: FiscalEntryExit.ENTRADA,
      status: FiscalDocumentStatus.REGULAR,
      origin: 'XML_IMPORTADO' as any,
      documentNumber: '000001',
      series: '1',
      accessKey: '35240112345678000101550010000000011000000011',
      issueDate: new Date('2025-01-10'),
      entryExitDate: new Date('2025-01-10'),
      cnpjIssuer: '99999999000191',
      nameIssuer: 'Fornecedor Central Ltda',
      stateRegIssuer: '123456789',
      ufIssuer: 'SP',
      cnpjRecipient: '12345678000101',
      nameRecipient: 'Casa Alfa',
      totalProducts: 1500.00,
      totalDocument: 1680.00,
      baseIcms: 1500.00,
      valueIcms: 180.00,
      valuePis: 9.75,
      valueCofins: 45.00,
      periodMonth: 1,
      periodYear: 2025,
      validationStatus: 'VALIDO' as any,
      createdById: adminId,
    },
    {
      clientId: alfaId,
      documentType: 'NF_E' as any,
      entryExit: FiscalEntryExit.SAIDA,
      status: FiscalDocumentStatus.REGULAR,
      origin: FiscalDocumentOrigin.DIGITACAO_MANUAL,
      documentNumber: '000100',
      series: '1',
      issueDate: new Date('2025-01-15'),
      cnpjIssuer: '12345678000101',
      nameIssuer: 'Casa Alfa',
      ufIssuer: 'SP',
      cnpjRecipient: '11111111000111',
      nameRecipient: 'Cliente Final SA',
      totalProducts: 2800.00,
      totalDocument: 2800.00,
      baseIcms: 2800.00,
      valueIcms: 336.00,
      valuePis: 18.20,
      valueCofins: 84.00,
      periodMonth: 1,
      periodYear: 2025,
      validationStatus: 'VALIDO' as any,
      createdById: adminId,
    },
    {
      clientId: alfaId,
      documentType: 'NF_E' as any,
      entryExit: FiscalEntryExit.ENTRADA,
      status: FiscalDocumentStatus.CANCELADA,
      origin: 'XML_IMPORTADO' as any,
      documentNumber: '000002',
      series: '1',
      accessKey: '35240212345678000101550010000000021000000028',
      issueDate: new Date('2025-02-05'),
      cnpjIssuer: '99999999000191',
      nameIssuer: 'Fornecedor Central Ltda',
      ufIssuer: 'SP',
      cnpjRecipient: '12345678000101',
      nameRecipient: 'Casa Alfa',
      totalProducts: 500.00,
      totalDocument: 560.00,
      baseIcms: 500.00,
      valueIcms: 60.00,
      periodMonth: 2,
      periodYear: 2025,
      validationStatus: 'VALIDO' as any,
      createdById: adminId,
    },
    {
      clientId: alfaId,
      documentType: 'NF_E' as any,
      entryExit: FiscalEntryExit.ENTRADA,
      status: FiscalDocumentStatus.DENEGADA,
      origin: 'XML_IMPORTADO' as any,
      documentNumber: '000003',
      series: '1',
      accessKey: '35240312345678000101550010000000031000000035',
      issueDate: new Date('2025-03-10'),
      cnpjIssuer: '88888888000188',
      nameIssuer: 'Fornecedor Suspenso Ltda',
      ufIssuer: 'RJ',
      cnpjRecipient: '12345678000101',
      nameRecipient: 'Casa Alfa',
      totalProducts: 300.00,
      totalDocument: 300.00,
      periodMonth: 3,
      periodYear: 2025,
      validationStatus: 'DIVERGENTE' as any,
      createdById: adminId,
    },
    {
      clientId: gamaId,
      documentType: 'NFS_E' as any,
      entryExit: FiscalEntryExit.SAIDA,
      status: FiscalDocumentStatus.REGULAR,
      origin: FiscalDocumentOrigin.DIGITACAO_MANUAL,
      documentNumber: '001',
      series: 'RPS',
      issueDate: new Date('2025-01-20'),
      cnpjIssuer: '12345678000103',
      nameIssuer: 'Clínica Gama',
      ufIssuer: 'SP',
      cnpjRecipient: '55555555000155',
      nameRecipient: 'Convênio MedSaúde',
      totalDocument: 8500.00,
      baseIss: 8500.00,
      valueIss: 170.00,
      valueCsll: 76.50,
      valuePis: 55.25,
      valueCofins: 255.00,
      valueIrrf: 212.50,
      periodMonth: 1,
      periodYear: 2025,
      validationStatus: 'VALIDO' as any,
      createdById: adminId,
    },
    {
      clientId: gamaId,
      documentType: 'NFS_E' as any,
      entryExit: FiscalEntryExit.SAIDA,
      status: FiscalDocumentStatus.INUTILIZADA,
      origin: FiscalDocumentOrigin.DIGITACAO_MANUAL,
      documentNumber: '002',
      series: 'RPS',
      issueDate: new Date('2025-02-28'),
      cnpjIssuer: '12345678000103',
      nameIssuer: 'Clínica Gama',
      ufIssuer: 'SP',
      cnpjRecipient: '00000000000000',
      nameRecipient: 'NF Inutilizada',
      totalDocument: 0,
      periodMonth: 2,
      periodYear: 2025,
      validationStatus: ValidationStatus.PENDENTE,
      createdById: adminId,
    },
    {
      clientId: betaId,
      documentType: 'NFS_E' as any,
      entryExit: FiscalEntryExit.SAIDA,
      status: FiscalDocumentStatus.REGULAR,
      origin: FiscalDocumentOrigin.DIGITACAO_MANUAL,
      documentNumber: '050',
      series: 'RPS',
      issueDate: new Date('2025-03-15'),
      cnpjIssuer: '12345678000102',
      nameIssuer: 'Beta Cloud',
      ufIssuer: 'SP',
      cnpjRecipient: '33333333000133',
      nameRecipient: 'Tech Corp SA',
      totalDocument: 15000.00,
      baseIss: 15000.00,
      valueIss: 750.00,
      valueCsll: 135.00,
      valuePis: 97.50,
      valueCofins: 450.00,
      valueIrrf: 375.00,
      periodMonth: 3,
      periodYear: 2025,
      validationStatus: 'VALIDO' as any,
      createdById: adminId,
    },
    {
      clientId: betaId,
      documentType: 'NFS_E' as any,
      entryExit: FiscalEntryExit.ENTRADA,
      status: FiscalDocumentStatus.REGULAR,
      origin: FiscalDocumentOrigin.DIGITACAO_MANUAL,
      documentNumber: '200',
      issueDate: new Date('2025-04-05'),
      cnpjIssuer: '77777777000177',
      nameIssuer: 'Consultoria Expert Ltda',
      ufIssuer: 'SP',
      cnpjRecipient: '12345678000102',
      nameRecipient: 'Beta Cloud',
      totalDocument: 5000.00,
      baseIss: 5000.00,
      valueIss: 100.00,
      periodMonth: 4,
      periodYear: 2025,
      validationStatus: 'VALIDO' as any,
      createdById: adminId,
    },
  ];

  await prisma.fiscalDocument.createMany({ skipDuplicates: true, data: docsNfe });

  // Apurações com todos os status
  const apuracoes: Prisma.TaxApurationCreateManyInput[] = [
    { clientId: alfaId, taxType: TaxApurationType.ICMS, periodMonth: 1, periodYear: 2025, status: ApurationStatus.ENCERRADA, calculatedAt: new Date('2025-02-10'), closedAt: new Date('2025-02-10') },
    { clientId: alfaId, taxType: TaxApurationType.PIS_COFINS, periodMonth: 1, periodYear: 2025, status: ApurationStatus.ENCERRADA, calculatedAt: new Date('2025-02-10'), closedAt: new Date('2025-02-10') },
    { clientId: alfaId, taxType: TaxApurationType.ICMS, periodMonth: 2, periodYear: 2025, status: ApurationStatus.CALCULADA, calculatedAt: new Date('2025-03-08') },
    { clientId: alfaId, taxType: TaxApurationType.PIS_COFINS, periodMonth: 2, periodYear: 2025, status: ApurationStatus.CALCULADA, calculatedAt: new Date('2025-03-08') },
    { clientId: alfaId, taxType: TaxApurationType.ICMS, periodMonth: 3, periodYear: 2025, status: ApurationStatus.ABERTA },
    { clientId: gamaId, taxType: TaxApurationType.ISS, periodMonth: 1, periodYear: 2025, status: ApurationStatus.ENCERRADA, calculatedAt: new Date('2025-02-10'), closedAt: new Date('2025-02-10') },
    { clientId: gamaId, taxType: TaxApurationType.ISS, periodMonth: 2, periodYear: 2025, status: ApurationStatus.CALCULADA, calculatedAt: new Date('2025-03-08') },
    { clientId: gamaId, taxType: TaxApurationType.ISS, periodMonth: 3, periodYear: 2025, status: ApurationStatus.ABERTA },
    { clientId: betaId, taxType: TaxApurationType.ISS, periodMonth: 1, periodYear: 2025, status: ApurationStatus.ENCERRADA, calculatedAt: new Date('2025-02-12'), closedAt: new Date('2025-02-12') },
    { clientId: betaId, taxType: TaxApurationType.PIS_COFINS, periodMonth: 1, periodYear: 2025, status: ApurationStatus.ENCERRADA, calculatedAt: new Date('2025-02-12'), closedAt: new Date('2025-02-12') },
    { clientId: betaId, taxType: TaxApurationType.ISS, periodMonth: 2, periodYear: 2025, status: ApurationStatus.ABERTA },
  ];
  await prisma.taxApuration.createMany({ skipDuplicates: true, data: apuracoes });

  // Resultados das apurações encerradas
  const apEncerradasAlfa = await prisma.taxApuration.findMany({
    where: { clientId: alfaId, status: ApurationStatus.ENCERRADA },
  });
  for (const ap of apEncerradasAlfa) {
    await prisma.taxApurationResult.upsert({
      where: { apurationId: ap.id },
      create: {
        apurationId: ap.id,
        totalDebits: 516.00,
        totalCredits: 180.00,
        balance: 0,
        taxDue: 336.00,
        pisRevenue: 2800.00,
        pisDebits: 18.20,
        pisCredits: 9.75,
        pisNet: 8.45,
        cofinsRevenue: 2800.00,
        cofinsDebits: 84.00,
        cofinsCredits: 45.00,
        cofinsNet: 39.00,
      },
      update: {},
    });
  }

  // Obrigações com todos os status
  const obrigacoes: Prisma.FiscalObligationCreateManyInput[] = [
    { clientId: alfaId, type: ObligationType.SPED_FISCAL, periodMonth: 1, periodYear: 2025, dueDate: new Date('2025-02-25'), status: ObligationStatus.TRANSMITIDA, generatedAt: new Date('2025-02-20'), transmittedAt: new Date('2025-02-22'), fileName: 'SPED_FISCAL_012025.txt' },
    { clientId: alfaId, type: ObligationType.SPED_FISCAL, periodMonth: 2, periodYear: 2025, dueDate: new Date('2025-03-25'), status: ObligationStatus.GERADA, generatedAt: new Date('2025-03-20'), fileName: 'SPED_FISCAL_022025.txt' },
    { clientId: alfaId, type: ObligationType.SPED_FISCAL, periodMonth: 3, periodYear: 2025, dueDate: new Date('2025-04-25'), status: ObligationStatus.PENDENTE },
    { clientId: alfaId, type: ObligationType.SPED_CONTRIBUICOES, periodMonth: 1, periodYear: 2025, dueDate: new Date('2025-02-28'), status: ObligationStatus.TRANSMITIDA, generatedAt: new Date('2025-02-25'), transmittedAt: new Date('2025-02-26') },
    { clientId: alfaId, type: ObligationType.DCTF, periodMonth: 1, periodYear: 2025, dueDate: new Date('2025-03-15'), status: ObligationStatus.ERRO, generatedAt: new Date('2025-03-12'), errorMessage: 'Certificado digital expirado' },
    { clientId: gamaId, type: ObligationType.NFSE_MUNICIPAL, periodMonth: 1, periodYear: 2025, dueDate: new Date('2025-02-10'), status: ObligationStatus.TRANSMITIDA, generatedAt: new Date('2025-02-08'), transmittedAt: new Date('2025-02-09') },
    { clientId: gamaId, type: ObligationType.REINF, periodMonth: 1, periodYear: 2025, dueDate: new Date('2025-02-15'), status: ObligationStatus.TRANSMITIDA, generatedAt: new Date('2025-02-13'), transmittedAt: new Date('2025-02-14') },
    { clientId: gamaId, type: ObligationType.NFSE_MUNICIPAL, periodMonth: 2, periodYear: 2025, dueDate: new Date('2025-03-10'), status: ObligationStatus.GERADA, generatedAt: new Date('2025-03-08') },
    { clientId: gamaId, type: ObligationType.NFSE_MUNICIPAL, periodMonth: 3, periodYear: 2025, dueDate: new Date('2025-04-10'), status: ObligationStatus.PENDENTE },
    { clientId: betaId, type: ObligationType.SPED_CONTRIBUICOES, periodMonth: 1, periodYear: 2025, dueDate: new Date('2025-02-28'), status: ObligationStatus.TRANSMITIDA, generatedAt: new Date('2025-02-25'), transmittedAt: new Date('2025-02-27') },
    { clientId: betaId, type: ObligationType.REINF, periodMonth: 1, periodYear: 2025, dueDate: new Date('2025-02-15'), status: ObligationStatus.DISPENSADA, notes: 'Dispensa por opção ao Simples' },
    { clientId: betaId, type: ObligationType.DCTF, periodMonth: 2, periodYear: 2025, dueDate: new Date('2025-03-15'), status: ObligationStatus.PENDENTE },
  ];

  await prisma.fiscalObligation.createMany({ skipDuplicates: true, data: obrigacoes });

  // Livros fiscais
  await prisma.fiscalBook.createMany({
    skipDuplicates: true,
    data: [
      { clientId: alfaId, bookType: BookType.ENTRADAS, periodMonth: 1, periodYear: 2025, totalEntries: 1, totalValueEntries: 1680.00, totalIcms: 180.00, totalPis: 9.75, totalCofins: 45.00, createdById: adminId },
      { clientId: alfaId, bookType: BookType.SAIDAS, periodMonth: 1, periodYear: 2025, totalSaidas: 1, totalValueSaidas: 2800.00, totalIcms: 336.00, totalPis: 18.20, totalCofins: 84.00, createdById: adminId },
      { clientId: alfaId, bookType: BookType.APURACAO_ICMS, periodMonth: 1, periodYear: 2025, totalIcms: 336.00, createdById: adminId },
      { clientId: gamaId, bookType: BookType.APURACAO_ISS, periodMonth: 1, periodYear: 2025, totalIss: 170.00, createdById: adminId },
    ],
  });

  console.log('  ✓ Dados fiscais criados');
}

// ── Contábil ──────────────────────────────────────────────────────────────────

async function createDemoAccountingData(clientIdsByCnpj: Map<string, string>, adminId: string) {
  const gamaId = clientIdsByCnpj.get('12345678000103')!;
  const betaId = clientIdsByCnpj.get('12345678000102')!;

  for (const clientId of [gamaId, betaId]) {
    // Plano de Contas hierárquico
    const ativo = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '1' } },
      create: { clientId, code: '1', name: 'ATIVO', type: AccountType.SINTETICA, nature: AccountNature.DEVEDORA, classification: AccountClass.ATIVO, level: 1, allowsEntry: false },
      update: {},
    });
    const ativoCirc = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '1.1' } },
      create: { clientId, code: '1.1', name: 'ATIVO CIRCULANTE', type: AccountType.SINTETICA, nature: AccountNature.DEVEDORA, classification: AccountClass.ATIVO, level: 2, parentId: ativo.id, allowsEntry: false },
      update: {},
    });
    const caixa = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '1.1.1' } },
      create: { clientId, code: '1.1.1', name: 'Caixa', type: AccountType.ANALITICA, nature: AccountNature.DEVEDORA, classification: AccountClass.ATIVO, level: 3, parentId: ativoCirc.id, spedRefCode: '01050001' },
      update: {},
    });
    const banco = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '1.1.2' } },
      create: { clientId, code: '1.1.2', name: 'Banco Itaú c/c 12345-6', type: AccountType.ANALITICA, nature: AccountNature.DEVEDORA, classification: AccountClass.ATIVO, level: 3, parentId: ativoCirc.id, spedRefCode: '01050002' },
      update: {},
    });
    const clientes = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '1.1.3' } },
      create: { clientId, code: '1.1.3', name: 'Clientes a Receber', type: AccountType.ANALITICA, nature: AccountNature.DEVEDORA, classification: AccountClass.ATIVO, level: 3, parentId: ativoCirc.id },
      update: {},
    });
    const ativoNaoCirc = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '1.2' } },
      create: { clientId, code: '1.2', name: 'ATIVO NÃO CIRCULANTE', type: AccountType.SINTETICA, nature: AccountNature.DEVEDORA, classification: AccountClass.ATIVO, level: 2, parentId: ativo.id, allowsEntry: false },
      update: {},
    });
    const imobilizado = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '1.2.1' } },
      create: { clientId, code: '1.2.1', name: 'Imobilizado', type: AccountType.ANALITICA, nature: AccountNature.DEVEDORA, classification: AccountClass.ATIVO, level: 3, parentId: ativoNaoCirc.id, integratesModules: true },
      update: {},
    });
    const passivo = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '2' } },
      create: { clientId, code: '2', name: 'PASSIVO', type: AccountType.SINTETICA, nature: AccountNature.CREDORA, classification: AccountClass.PASSIVO, level: 1, allowsEntry: false },
      update: {},
    });
    const passCirc = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '2.1' } },
      create: { clientId, code: '2.1', name: 'PASSIVO CIRCULANTE', type: AccountType.SINTETICA, nature: AccountNature.CREDORA, classification: AccountClass.PASSIVO, level: 2, parentId: passivo.id, allowsEntry: false },
      update: {},
    });
    const fornecedores = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '2.1.1' } },
      create: { clientId, code: '2.1.1', name: 'Fornecedores', type: AccountType.ANALITICA, nature: AccountNature.CREDORA, classification: AccountClass.PASSIVO, level: 3, parentId: passCirc.id },
      update: {},
    });
    const impostos = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '2.1.2' } },
      create: { clientId, code: '2.1.2', name: 'Impostos a Recolher', type: AccountType.ANALITICA, nature: AccountNature.CREDORA, classification: AccountClass.PASSIVO, level: 3, parentId: passCirc.id },
      update: {},
    });
    const pl = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '3' } },
      create: { clientId, code: '3', name: 'PATRIMÔNIO LÍQUIDO', type: AccountType.SINTETICA, nature: AccountNature.CREDORA, classification: AccountClass.PATRIMONIO_LIQUIDO, level: 1, allowsEntry: false },
      update: {},
    });
    const capitalSocial = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '3.1' } },
      create: { clientId, code: '3.1', name: 'Capital Social', type: AccountType.ANALITICA, nature: AccountNature.CREDORA, classification: AccountClass.PATRIMONIO_LIQUIDO, level: 2, parentId: pl.id },
      update: {},
    });
    const lucrosAcum = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '3.2' } },
      create: { clientId, code: '3.2', name: 'Lucros/Prejuízos Acumulados', type: AccountType.ANALITICA, nature: AccountNature.CREDORA, classification: AccountClass.PATRIMONIO_LIQUIDO, level: 2, parentId: pl.id },
      update: {},
    });
    const receitas = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '4' } },
      create: { clientId, code: '4', name: 'RECEITAS', type: AccountType.SINTETICA, nature: AccountNature.CREDORA, classification: AccountClass.RECEITA, level: 1, allowsEntry: false },
      update: {},
    });
    const receitaServicos = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '4.1' } },
      create: { clientId, code: '4.1', name: 'Receita de Serviços', type: AccountType.ANALITICA, nature: AccountNature.CREDORA, classification: AccountClass.RECEITA, level: 2, parentId: receitas.id, ecfRefCode: 'M300' },
      update: {},
    });
    const despesas = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '5' } },
      create: { clientId, code: '5', name: 'DESPESAS', type: AccountType.SINTETICA, nature: AccountNature.DEVEDORA, classification: AccountClass.DESPESA, level: 1, allowsEntry: false },
      update: {},
    });
    const despPessoal = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '5.1' } },
      create: { clientId, code: '5.1', name: 'Despesas de Pessoal', type: AccountType.ANALITICA, nature: AccountNature.DEVEDORA, classification: AccountClass.DESPESA, level: 2, parentId: despesas.id },
      update: {},
    });
    const despAdmin = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '5.2' } },
      create: { clientId, code: '5.2', name: 'Despesas Administrativas', type: AccountType.ANALITICA, nature: AccountNature.DEVEDORA, classification: AccountClass.DESPESA, level: 2, parentId: despesas.id },
      update: {},
    });
    const despDepreciacao = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '5.3' } },
      create: { clientId, code: '5.3', name: 'Depreciação e Amortização', type: AccountType.ANALITICA, nature: AccountNature.DEVEDORA, classification: AccountClass.DESPESA, level: 2, parentId: despesas.id, integratesModules: true },
      update: {},
    });
    const resultado = await prisma.accountingPlan.upsert({
      where: { clientId_code: { clientId, code: '6' } },
      create: { clientId, code: '6', name: 'CONTA DE RESULTADO', type: AccountType.ANALITICA, nature: AccountNature.CREDORA, classification: AccountClass.RESULTADO, level: 1 },
      update: {},
    });

    // Centro de Custo
    const ccAdm = await prisma.costCenter.upsert({
      where: { clientId_code: { clientId, code: 'ADM' } },
      create: { clientId, code: 'ADM', name: 'Administrativo', type: CostCenterType.ADMINISTRATIVO },
      update: {},
    });
    const ccOp = await prisma.costCenter.upsert({
      where: { clientId_code: { clientId, code: 'OP' } },
      create: { clientId, code: 'OP', name: 'Operacional', type: CostCenterType.OPERACIONAL },
      update: {},
    });

    // Históricos padrão
    await prisma.standardHistory.upsert({
      where: { clientId_code: { clientId, code: 'H001' } },
      create: { clientId, code: 'H001', text: 'Recebimento de clientes' },
      update: {},
    });
    await prisma.standardHistory.upsert({
      where: { clientId_code: { clientId, code: 'H002' } },
      create: { clientId, code: 'H002', text: 'Pagamento a fornecedores' },
      update: {},
    });
    await prisma.standardHistory.upsert({
      where: { clientId_code: { clientId, code: 'H003' } },
      create: { clientId, code: 'H003', text: 'Depreciação mensal do imobilizado' },
      update: {},
    });
    await prisma.standardHistory.upsert({
      where: { clientId_code: { clientId, code: 'H004' } },
      create: { clientId, code: 'H004', text: 'Folha de pagamento' },
      update: {},
    });

    // Tipos de lançamento
    await prisma.entryType.upsert({
      where: { clientId_code: { clientId, code: 'LN' } },
      create: { clientId, code: 'LN', name: 'Lançamento Normal', classification: EntryTypeClass.NORMAL },
      update: {},
    });
    await prisma.entryType.upsert({
      where: { clientId_code: { clientId, code: 'PR' } },
      create: { clientId, code: 'PR', name: 'Provisão', classification: EntryTypeClass.PROVISAO },
      update: {},
    });
    await prisma.entryType.upsert({
      where: { clientId_code: { clientId, code: 'AJ' } },
      create: { clientId, code: 'AJ', name: 'Ajuste', classification: EntryTypeClass.AJUSTE },
      update: {},
    });
    await prisma.entryType.upsert({
      where: { clientId_code: { clientId, code: 'EN' } },
      create: { clientId, code: 'EN', name: 'Encerramento', classification: EntryTypeClass.ENCERRAMENTO },
      update: {},
    });

    // Parâmetros contábeis
    await prisma.accountingParameters.upsert({
      where: { clientId },
      create: {
        clientId,
        integrateFiscal: true,
        integratePatrimony: true,
        currentYear: 2025,
        resultAccountId: resultado.id,
        retainedEarningsAccId: lucrosAcum.id,
        closedPeriods: ['2025-01', '2025-02'],
      },
      update: {},
    });

    // Encerramento de período
    await prisma.periodClosing.upsert({
      where: { clientId_periodYear_periodMonth: { clientId, periodYear: 2025, periodMonth: 1 } },
      create: { clientId, periodYear: 2025, periodMonth: 1, status: PeriodClosingStatus.FECHADO, closedAt: new Date('2025-02-15'), closedById: adminId },
      update: {},
    });
    await prisma.periodClosing.upsert({
      where: { clientId_periodYear_periodMonth: { clientId, periodYear: 2025, periodMonth: 2 } },
      create: { clientId, periodYear: 2025, periodMonth: 2, status: PeriodClosingStatus.FECHADO, closedAt: new Date('2025-03-14'), closedById: adminId },
      update: {},
    });
    await prisma.periodClosing.upsert({
      where: { clientId_periodYear_periodMonth: { clientId, periodYear: 2025, periodMonth: 3 } },
      create: { clientId, periodYear: 2025, periodMonth: 3, status: PeriodClosingStatus.ABERTO },
      update: {},
    });

    // Lançamentos contábeis com todos os status
    const entryConfirmado = await prisma.accountingEntry.upsert({
      where: { clientId_entryNumber: { clientId, entryNumber: 1 } },
      create: {
        clientId,
        entryNumber: 1,
        entryDate: new Date('2025-01-10'),
        periodMonth: 1,
        periodYear: 2025,
        description: 'Recebimento de clientes — janeiro',
        status: EntryStatus.CONFIRMADO,
        source: EntrySource.MANUAL,
        createdById: adminId,
        lines: {
          create: [
            { lineNumber: 1, accountId: banco.id, debitCredit: DebitCredit.DEBITO, value: 8500.00, complement: 'Depósito recebido' },
            { lineNumber: 2, accountId: receitaServicos.id, debitCredit: DebitCredit.CREDITO, value: 8500.00, complement: 'Receita jan/25' },
          ],
        },
      },
      update: {},
    });

    await prisma.accountingEntry.upsert({
      where: { clientId_entryNumber: { clientId, entryNumber: 2 } },
      create: {
        clientId,
        entryNumber: 2,
        entryDate: new Date('2025-01-20'),
        periodMonth: 1,
        periodYear: 2025,
        description: 'Pagamento fornecedores — janeiro',
        status: EntryStatus.CONFIRMADO,
        source: EntrySource.MANUAL,
        createdById: adminId,
        lines: {
          create: [
            { lineNumber: 1, accountId: fornecedores.id, debitCredit: DebitCredit.DEBITO, value: 2000.00 },
            { lineNumber: 2, accountId: banco.id, debitCredit: DebitCredit.CREDITO, value: 2000.00 },
          ],
        },
      },
      update: {},
    });

    await prisma.accountingEntry.upsert({
      where: { clientId_entryNumber: { clientId, entryNumber: 3 } },
      create: {
        clientId,
        entryNumber: 3,
        entryDate: new Date('2025-01-31'),
        periodMonth: 1,
        periodYear: 2025,
        description: 'Depreciação mensal — jan/25',
        status: EntryStatus.CONFIRMADO,
        source: EntrySource.MANUAL,
        createdById: adminId,
        lines: {
          create: [
            { lineNumber: 1, accountId: despDepreciacao.id, debitCredit: DebitCredit.DEBITO, value: 1250.00 },
            { lineNumber: 2, accountId: imobilizado.id, debitCredit: DebitCredit.CREDITO, value: 1250.00 },
          ],
        },
      },
      update: {},
    });

    // Lançamento em rascunho
    await prisma.accountingEntry.upsert({
      where: { clientId_entryNumber: { clientId, entryNumber: 4 } },
      create: {
        clientId,
        entryNumber: 4,
        entryDate: new Date('2025-03-05'),
        periodMonth: 3,
        periodYear: 2025,
        description: 'Provisão IRPJ e CSLL — mar/25',
        status: EntryStatus.RASCUNHO,
        source: EntrySource.MANUAL,
        createdById: adminId,
        lines: {
          create: [
            { lineNumber: 1, accountId: despAdmin.id, debitCredit: DebitCredit.DEBITO, value: 4500.00 },
            { lineNumber: 2, accountId: impostos.id, debitCredit: DebitCredit.CREDITO, value: 4500.00 },
          ],
        },
      },
      update: {},
    });

    // Lançamento estornado
    const entryEstornado = await prisma.accountingEntry.upsert({
      where: { clientId_entryNumber: { clientId, entryNumber: 5 } },
      create: {
        clientId,
        entryNumber: 5,
        entryDate: new Date('2025-02-10'),
        periodMonth: 2,
        periodYear: 2025,
        description: 'Recebimento duplicado — ESTORNADO',
        status: EntryStatus.ESTORNADO,
        source: EntrySource.MANUAL,
        createdById: adminId,
        lines: {
          create: [
            { lineNumber: 1, accountId: banco.id, debitCredit: DebitCredit.DEBITO, value: 1000.00 },
            { lineNumber: 2, accountId: receitaServicos.id, debitCredit: DebitCredit.CREDITO, value: 1000.00 },
          ],
        },
      },
      update: {},
    });

    // Lançamento de estorno (referência ao anterior)
    await prisma.accountingEntry.upsert({
      where: { clientId_entryNumber: { clientId, entryNumber: 6 } },
      create: {
        clientId,
        entryNumber: 6,
        entryDate: new Date('2025-02-11'),
        periodMonth: 2,
        periodYear: 2025,
        description: 'Estorno do lançamento nº 5',
        status: EntryStatus.CONFIRMADO,
        source: EntrySource.ESTORNO,
        reversedById: entryEstornado.id,
        createdById: adminId,
        lines: {
          create: [
            { lineNumber: 1, accountId: receitaServicos.id, debitCredit: DebitCredit.DEBITO, value: 1000.00 },
            { lineNumber: 2, accountId: banco.id, debitCredit: DebitCredit.CREDITO, value: 1000.00 },
          ],
        },
      },
      update: {},
    });
  }

  console.log('  ✓ Dados contábeis criados');
}

// ── LALUR / LACS ──────────────────────────────────────────────────────────────

async function createDemoLalurData(clientIdsByCnpj: Map<string, string>, adminId: string) {
  const gamaId = clientIdsByCnpj.get('12345678000103')!;

  // Tipos de ajuste
  const adjMulta = await prisma.lalurAdjustType.upsert({
    where: { clientId_code: { clientId: gamaId, code: 'AD001' } },
    create: { clientId: gamaId, code: 'AD001', description: 'Multas e Penalidades Fiscais', nature: LalurAdjustNature.ADICAO, timing: LalurAdjustTiming.PERMANENTE, ecfRefCode: 'M300' },
    update: {},
  });
  const adjDeprecAcel = await prisma.lalurAdjustType.upsert({
    where: { clientId_code: { clientId: gamaId, code: 'AD002' } },
    create: { clientId: gamaId, code: 'AD002', description: 'Depreciação Acelerada Incentivada', nature: LalurAdjustNature.ADICAO, timing: 'TEMPORARIA' as any, ecfRefCode: 'M300' },
    update: {},
  });
  const adjJcp = await prisma.lalurAdjustType.upsert({
    where: { clientId_code: { clientId: gamaId, code: 'EX001' } },
    create: { clientId: gamaId, code: 'EX001', description: 'Juros sobre Capital Próprio', nature: LalurAdjustNature.EXCLUSAO, timing: LalurAdjustTiming.PERMANENTE, ecfRefCode: 'M350' },
    update: {},
  });
  const adjEquiv = await prisma.lalurAdjustType.upsert({
    where: { clientId_code: { clientId: gamaId, code: 'EX002' } },
    create: { clientId: gamaId, code: 'EX002', description: 'Resultado Positivo de Equivalência Patrimonial', nature: LalurAdjustNature.EXCLUSAO, timing: LalurAdjustTiming.PERMANENTE, ecfRefCode: 'M350' },
    update: {},
  });

  // Regras contábeis
  await prisma.lalurAccountingRule.upsert({
    where: { clientId_accountCode: { clientId: gamaId, accountCode: '5.2.9' } },
    create: { clientId: gamaId, accountCode: '5.2.9', adjustTypeId: adjMulta.id, nature: LalurAdjustNature.ADICAO, description: 'Multas debitadas em despesas admin → adição automática' },
    update: {},
  });
  await prisma.lalurAccountingRule.upsert({
    where: { clientId_accountCode: { clientId: gamaId, accountCode: '4.3' } },
    create: { clientId: gamaId, accountCode: '4.3', adjustTypeId: adjEquiv.id, nature: LalurAdjustNature.EXCLUSAO, description: 'Equivalência patrimonial positiva → exclusão automática' },
    update: {},
  });

  // Período 2024 — encerrado
  const period2024 = await prisma.lalurPeriod.upsert({
    where: { clientId_periodYear: { clientId: gamaId, periodYear: 2024 } },
    create: {
      clientId: gamaId,
      periodYear: 2024,
      taxRegime: TaxRegimeCalc.LUCRO_REAL,
      accountingProfit: 480000.00,
      totalAdditions: 35000.00,
      totalExclusions: 28000.00,
      totalCompensations: 45937.50,
      realProfit: 441062.50,
      status: 'ENCERRADO' as any,
      lockedAt: new Date('2025-03-31'),
      lockedByUserId: adminId,
    },
    update: {},
  });

  // Período 2025 — em andamento
  const period2025 = await prisma.lalurPeriod.upsert({
    where: { clientId_periodYear: { clientId: gamaId, periodYear: 2025 } },
    create: {
      clientId: gamaId,
      periodYear: 2025,
      taxRegime: TaxRegimeCalc.LUCRO_REAL,
      accountingProfit: 312000.00,
      totalAdditions: 18500.00,
      totalExclusions: 12000.00,
      totalCompensations: 0,
      realProfit: 318500.00,
      status: IrpjCsllCalcStatus.CALCULADO,
    },
    update: {},
  });

  // Parte A — 2024
  const partAMulta2024 = await prisma.lalurPartAEntry.create({
    data: {
      lalurPeriodId: period2024.id,
      adjustTypeId: adjMulta.id,
      sequence: 1,
      description: 'Multa SEFAZ — Auto de Infração 2023/01234',
      nature: LalurAdjustNature.ADICAO,
      timing: LalurAdjustTiming.PERMANENTE,
      value: 15000.00,
      accountCode: '5.2.9',
      documentRef: 'AI-2023/01234',
      periodMonth: 3,
    },
  }).catch(() => null);

  const partADeprecAcel2024 = await prisma.lalurPartAEntry.create({
    data: {
      lalurPeriodId: period2024.id,
      adjustTypeId: adjDeprecAcel.id,
      sequence: 2,
      description: 'Adição depreciação acelerada incentivada — equipamentos',
      nature: LalurAdjustNature.ADICAO,
      timing: 'TEMPORARIA' as any,
      value: 20000.00,
      accountCode: '5.3',
      periodMonth: 12,
    },
  }).catch(() => null);

  const partAJcp2024 = await prisma.lalurPartAEntry.create({
    data: {
      lalurPeriodId: period2024.id,
      adjustTypeId: adjJcp.id,
      sequence: 3,
      description: 'JCP pagos aos sócios',
      nature: LalurAdjustNature.EXCLUSAO,
      timing: LalurAdjustTiming.PERMANENTE,
      value: 18000.00,
      accountCode: '3.1',
      periodMonth: 12,
    },
  }).catch(() => null);

  const partAEquiv2024 = await prisma.lalurPartAEntry.create({
    data: {
      lalurPeriodId: period2024.id,
      adjustTypeId: adjEquiv.id,
      sequence: 4,
      description: 'Resultado positivo de equivalência patrimonial',
      nature: LalurAdjustNature.EXCLUSAO,
      timing: LalurAdjustTiming.PERMANENTE,
      value: 10000.00,
      accountCode: '4.3',
      periodMonth: 12,
    },
  }).catch(() => null);

  // Parte A — 2025
  await prisma.lalurPartAEntry.create({
    data: {
      lalurPeriodId: period2025.id,
      adjustTypeId: adjMulta.id,
      sequence: 1,
      description: 'Multa FGTS — notificação 2025/00456',
      nature: LalurAdjustNature.ADICAO,
      timing: LalurAdjustTiming.PERMANENTE,
      value: 8500.00,
      accountCode: '5.2.9',
      documentRef: 'FGTS-2025/00456',
      periodMonth: 2,
    },
  }).catch(() => null);

  await prisma.lalurPartAEntry.create({
    data: {
      lalurPeriodId: period2025.id,
      adjustTypeId: adjDeprecAcel.id,
      sequence: 2,
      description: 'Adição depreciação acelerada — tomógrafo',
      nature: LalurAdjustNature.ADICAO,
      timing: 'TEMPORARIA' as any,
      value: 10000.00,
      accountCode: '5.3',
      periodMonth: 3,
    },
  }).catch(() => null);

  await prisma.lalurPartAEntry.create({
    data: {
      lalurPeriodId: period2025.id,
      adjustTypeId: adjJcp.id,
      sequence: 3,
      description: 'JCP pagos — jan a mar/25',
      nature: LalurAdjustNature.EXCLUSAO,
      timing: LalurAdjustTiming.PERMANENTE,
      value: 12000.00,
      accountCode: '3.1',
      periodMonth: 3,
    },
  }).catch(() => null);

  // Parte B — saldos com todos os 9 tipos de controle
  const partBPrejuizo = await prisma.lalurPartBBalance.create({
    data: {
      lalurPeriodId: period2024.id,
      partAEntryId: partADeprecAcel2024?.id,
      description: 'Prejuízo Fiscal exercício 2022',
      type: 'DEDUCAO_FUTURA' as any,
      controlType: LalurPartBControlType.PREJUIZO_FISCAL,
      originDate: new Date('2022-12-31'),
      originalValue: 200000.00,
      usedValue: 45937.50,
      openingBalance: 200000.00,
      additions: 0,
      realizations: 45937.50,
      closingBalance: 154062.50,
    },
  }).catch(() => prisma.lalurPartBBalance.findFirst({ where: { lalurPeriodId: period2024.id, controlType: LalurPartBControlType.PREJUIZO_FISCAL } }));

  const partBBaseNeg = await prisma.lalurPartBBalance.create({
    data: {
      lalurPeriodId: period2024.id,
      description: 'Base Negativa CSLL exercício 2021',
      type: 'TRIBUTACAO_FUTURA' as any,
      controlType: LalurPartBControlType.BASE_NEGATIVA_CSLL,
      originDate: new Date('2021-12-31'),
      originalValue: 150000.00,
      usedValue: 30000.00,
      openingBalance: 150000.00,
      additions: 0,
      realizations: 30000.00,
      closingBalance: 120000.00,
    },
  }).catch(() => prisma.lalurPartBBalance.findFirst({ where: { lalurPeriodId: period2024.id, controlType: LalurPartBControlType.BASE_NEGATIVA_CSLL } }));

  const partBDeprecAcel = await prisma.lalurPartBBalance.create({
    data: {
      lalurPeriodId: period2024.id,
      partAEntryId: partADeprecAcel2024?.id,
      description: 'Depreciação Acelerada Incentivada — equipamentos médicos',
      type: 'DEDUCAO_FUTURA' as any,
      controlType: LalurPartBControlType.DEPRECIACAO_ACELERADA,
      originDate: new Date('2024-12-31'),
      originalValue: 20000.00,
      usedValue: 0,
      openingBalance: 0,
      additions: 20000.00,
      realizations: 0,
      closingBalance: 20000.00,
    },
  }).catch(() => prisma.lalurPartBBalance.findFirst({ where: { lalurPeriodId: period2024.id, controlType: LalurPartBControlType.DEPRECIACAO_ACELERADA } }));

  const partBJcp = await prisma.lalurPartBBalance.create({
    data: {
      lalurPeriodId: period2024.id,
      description: 'JCP diferido não deduzido no exercício',
      type: 'DEDUCAO_FUTURA' as any,
      controlType: LalurPartBControlType.JCP_DIFERIDO,
      originDate: new Date('2023-12-31'),
      originalValue: 25000.00,
      usedValue: 0,
      openingBalance: 25000.00,
      additions: 0,
      realizations: 0,
      closingBalance: 25000.00,
    },
  }).catch(() => prisma.lalurPartBBalance.findFirst({ where: { lalurPeriodId: period2024.id, controlType: LalurPartBControlType.JCP_DIFERIDO } }));

  await prisma.lalurPartBBalance.create({
    data: {
      lalurPeriodId: period2024.id,
      description: 'Ajuste temporário — provisão para contingências',
      type: 'DEDUCAO_FUTURA' as any,
      controlType: LalurPartBControlType.AJUSTE_TEMPORARIO,
      openingBalance: 0,
      additions: 8000.00,
      realizations: 0,
      closingBalance: 8000.00,
    },
  }).catch(() => null);

  await prisma.lalurPartBBalance.create({
    data: {
      lalurPeriodId: period2024.id,
      description: 'Incentivo fiscal — Programa de Capacitação',
      type: 'DEDUCAO_FUTURA' as any,
      controlType: LalurPartBControlType.INCENTIVO_FISCAL,
      openingBalance: 0,
      additions: 5000.00,
      realizations: 2000.00,
      closingBalance: 3000.00,
    },
  }).catch(() => null);

  await prisma.lalurPartBBalance.create({
    data: {
      lalurPeriodId: period2024.id,
      description: 'Amortização diferida — ágio em aquisição',
      type: 'DEDUCAO_FUTURA' as any,
      controlType: LalurPartBControlType.AMORTIZACAO_DIFERIDA,
      openingBalance: 80000.00,
      additions: 0,
      realizations: 20000.00,
      closingBalance: 60000.00,
    },
  }).catch(() => null);

  await prisma.lalurPartBBalance.create({
    data: {
      lalurPeriodId: period2024.id,
      description: 'Equivalência patrimonial diferida',
      type: 'DEDUCAO_FUTURA' as any,
      controlType: LalurPartBControlType.EQUIVALENCIA_PATRIMONIAL,
      openingBalance: 12000.00,
      additions: 0,
      realizations: 12000.00,
      closingBalance: 0,
    },
  }).catch(() => null);

  await prisma.lalurPartBBalance.create({
    data: {
      lalurPeriodId: period2024.id,
      description: 'Perda recuperável — participação societária',
      type: 'DEDUCAO_FUTURA' as any,
      controlType: LalurPartBControlType.PERDA_RECUPERAVEL,
      openingBalance: 0,
      additions: 30000.00,
      realizations: 0,
      closingBalance: 30000.00,
    },
  }).catch(() => null);

  // Movimentações da Parte B — todos os tipos
  if (partBPrejuizo) {
    await prisma.lalurPartBMovement.createMany({
      data: [
        {
          partBBalanceId: (partBPrejuizo as any).id,
          type: LalurPartBMovType.INCLUSAO,
          value: 200000.00,
          description: 'Inclusão do prejuízo fiscal apurado em 31/12/2022',
          documentRef: 'LALUR-2022',
          movementDate: new Date('2022-12-31'),
          createdByUserId: adminId,
        },
        {
          partBBalanceId: (partBPrejuizo as any).id,
          type: LalurPartBMovType.UTILIZACAO,
          value: 45937.50,
          description: 'Compensação de 30% do lucro real 2024 — R$ 441.062,50 × 30% = R$ 132.318,75 (limitado ao saldo disponível)',
          documentRef: 'COMP-2024',
          movementDate: new Date('2024-12-31'),
          createdByUserId: adminId,
        },
      ],
    });
  }

  if (partBDeprecAcel) {
    await prisma.lalurPartBMovement.createMany({
      data: [
        {
          partBBalanceId: (partBDeprecAcel as any).id,
          type: LalurPartBMovType.INCLUSAO,
          value: 20000.00,
          description: 'Adição depreciação acelerada — tomógrafo e equipamentos de imagem',
          documentRef: 'NF-2024/8900',
          movementDate: new Date('2024-12-31'),
          createdByUserId: adminId,
        },
      ],
    });
  }

  if (partBJcp) {
    await prisma.lalurPartBMovement.createMany({
      data: [
        {
          partBBalanceId: (partBJcp as any).id,
          type: LalurPartBMovType.INCLUSAO,
          value: 25000.00,
          description: 'JCP diferido acumulado 2023',
          movementDate: new Date('2023-12-31'),
          createdByUserId: adminId,
        },
        {
          partBBalanceId: (partBJcp as any).id,
          type: LalurPartBMovType.BAIXA,
          value: 5000.00,
          description: 'Baixa por decisão societária — parte do JCP não será aproveitado',
          movementDate: new Date('2024-06-30'),
          createdByUserId: adminId,
        },
        {
          partBBalanceId: (partBJcp as any).id,
          type: LalurPartBMovType.TRANSFERENCIA,
          value: 20000.00,
          description: 'Transferência para controle de JCP diferido exercício 2024',
          movementDate: new Date('2024-12-31'),
          createdByUserId: adminId,
        },
      ],
    });
  }

  // Compensações
  await prisma.lalurCompensation.create({
    data: {
      clientId: gamaId,
      lalurPeriodId: period2024.id,
      originYear: 2022,
      type: 'IRPJ',
      originalValue: 200000.00,
      availableValue: 200000.00,
      usedValue: 45937.50,
      remainingValue: 154062.50,
      usedInYear: 2024,
      notes: 'Compensação de 30% do lucro real 2024',
    },
  }).catch(() => null);

  await prisma.lalurCompensation.create({
    data: {
      clientId: gamaId,
      lalurPeriodId: period2024.id,
      originYear: 2021,
      type: 'CSLL',
      originalValue: 150000.00,
      availableValue: 150000.00,
      usedValue: 30000.00,
      remainingValue: 120000.00,
      usedInYear: 2024,
    },
  }).catch(() => null);

  // Cálculo IRPJ/CSLL 2024
  await prisma.irpjCsllCalc.upsert({
    where: { lalurPeriodId: period2024.id },
    create: {
      lalurPeriodId: period2024.id,
      taxRegime: TaxRegimeCalc.LUCRO_REAL,
      irpjBase: 441062.50,
      csllBase: 441062.50,
      irpjRate: 15,
      irpjValue: 66159.38,
      irpjSurchargeBase: 241062.50,
      irpjSurchargeRate: 10,
      irpjSurchargeValue: 24106.25,
      irpjTotal: 90265.63,
      csllRate: 9,
      csllValue: 39695.63,
      irpjIncentives: 0,
      csllIncentives: 0,
      irpjNet: 90265.63,
      csllNet: 39695.63,
      irpjMonthlyEstimate: 7522.14,
      csllMonthlyEstimate: 3307.97,
      status: 'ENCERRADO' as any,
      calculatedAt: new Date('2025-03-15'),
    },
    update: {},
  });

  // Cálculo IRPJ/CSLL 2025 — em rascunho
  await prisma.irpjCsllCalc.upsert({
    where: { lalurPeriodId: period2025.id },
    create: {
      lalurPeriodId: period2025.id,
      taxRegime: TaxRegimeCalc.LUCRO_REAL,
      irpjBase: 318500.00,
      csllBase: 318500.00,
      irpjRate: 15,
      irpjValue: 47775.00,
      irpjSurchargeBase: 118500.00,
      irpjSurchargeRate: 10,
      irpjSurchargeValue: 11850.00,
      irpjTotal: 59625.00,
      csllRate: 9,
      csllValue: 28665.00,
      irpjNet: 59625.00,
      csllNet: 28665.00,
      status: IrpjCsllCalcStatus.CALCULADO,
      calculatedAt: new Date('2025-06-01'),
    },
    update: {},
  });

  // ECF com todos os status
  await prisma.ecfFile.upsert({
    where: { clientId_periodYear: { clientId: gamaId, periodYear: 2024 } },
    create: {
      clientId: gamaId,
      periodYear: 2024,
      status: EcfStatus.TRANSMITIDA,
      fileName: 'ECF_2024_12345678000103.txt',
      fileContent: '|0000|ECF|0001|12345678000103|CLINICA GAMA SAUDE INTEGRADA||SP|2024|0|0|0|',
      generatedAt: new Date('2025-07-10'),
      transmittedAt: new Date('2025-07-20'),
    },
    update: {},
  });

  await prisma.ecfFile.upsert({
    where: { clientId_periodYear: { clientId: gamaId, periodYear: 2025 } },
    create: {
      clientId: gamaId,
      periodYear: 2025,
      status: EcfStatus.PENDENTE,
    },
    update: {},
  });

  // Log de auditoria LALUR
  await prisma.lalurAuditLog.createMany({
    data: [
      {
        clientId: gamaId,
        lalurPeriodId: period2024.id,
        entity: 'LalurPeriod',
        entityId: period2024.id,
        action: LalurAuditAction.LOCK,
        before: JSON.stringify({ status: 'HOMOLOGADO', lockedAt: null }),
        after: JSON.stringify({ status: 'HOMOLOGADO', lockedAt: new Date('2025-03-31') }),
        userId: adminId,
      },
      {
        clientId: gamaId,
        lalurPeriodId: period2025.id,
        entity: 'IrpjCsllCalc',
        entityId: period2025.id,
        action: LalurAuditAction.CREATE,
        after: JSON.stringify({ irpjBase: 318500, csllBase: 318500, status: 'CALCULADO' }),
        userId: adminId,
      },
      {
        clientId: gamaId,
        lalurPeriodId: period2024.id,
        entity: 'LalurCompensation',
        action: LalurAuditAction.CREATE,
        after: JSON.stringify({ originYear: 2022, type: 'IRPJ', usedValue: 45937.50 }),
        userId: adminId,
      },
      {
        clientId: gamaId,
        lalurPeriodId: period2025.id,
        entity: 'LalurPartAEntry',
        action: LalurAuditAction.CREATE,
        after: JSON.stringify({ description: 'Multa FGTS', nature: 'ADICAO', value: 8500 }),
        userId: adminId,
      },
      {
        clientId: gamaId,
        lalurPeriodId: period2025.id,
        entity: 'LalurPartAEntry',
        action: LalurAuditAction.UPDATE,
        before: JSON.stringify({ value: 7500 }),
        after: JSON.stringify({ value: 8500, notes: 'Valor corrigido após análise do auto' }),
        userId: adminId,
      },
    ],
  });

  // Importação da contabilidade
  await prisma.lalurAccountingImport.create({
    data: {
      clientId: gamaId,
      lalurPeriodId: period2025.id,
      accountingProfit: 312000.00,
      adjustmentsCount: 2,
      notes: 'Importação automática a partir do balancete jan-mar/25',
      importedByUserId: adminId,
    },
  }).catch(() => null);

  console.log('  ✓ Dados LALUR/LACS criados');
}

// ── Patrimônio ────────────────────────────────────────────────────────────────

async function createDemoPatrimonyData(clientIdsByCnpj: Map<string, string>, adminId: string) {
  const gamaId = clientIdsByCnpj.get('12345678000103')!;
  const betaId = clientIdsByCnpj.get('12345678000102')!;

  for (const clientId of [gamaId, betaId]) {
    const isGama = clientId === gamaId;

    // Grupos de patrimônio
    const grpMoveis = await prisma.patrimonyGroup.upsert({
      where: { clientId_code: { clientId, code: 'MOV' } },
      create: {
        clientId,
        code: 'MOV',
        name: 'Móveis e Utensílios',
        deprecMethod: PatrimonyDeprecMethod.LINEAR,
        usefulLifeYears: 10,
        annualRate: 10,
        assetAccountCode: '1.2.1',
        accumDeprecAccountCode: '1.2.2',
        deprecExpenseAccountCode: '5.3',
      },
      update: {},
    });

    const grpEquipTi = await prisma.patrimonyGroup.upsert({
      where: { clientId_code: { clientId, code: 'TI' } },
      create: {
        clientId,
        code: 'TI',
        name: 'Equipamentos de TI',
        deprecMethod: PatrimonyDeprecMethod.LINEAR,
        usefulLifeYears: 5,
        annualRate: 20,
        assetAccountCode: '1.2.1',
        accumDeprecAccountCode: '1.2.2',
        deprecExpenseAccountCode: '5.3',
      },
      update: {},
    });

    const grpEquipMed = isGama ? await prisma.patrimonyGroup.upsert({
      where: { clientId_code: { clientId, code: 'MED' } },
      create: {
        clientId,
        code: 'MED',
        name: 'Equipamentos Médicos',
        deprecMethod: PatrimonyDeprecMethod.LINEAR,
        usefulLifeYears: 10,
        annualRate: 10,
        assetAccountCode: '1.2.1',
        accumDeprecAccountCode: '1.2.2',
        deprecExpenseAccountCode: '5.3',
      },
      update: {},
    }) : null;

    const grpVeic = await prisma.patrimonyGroup.upsert({
      where: { clientId_code: { clientId, code: 'VEIC' } },
      create: {
        clientId,
        code: 'VEIC',
        name: 'Veículos',
        deprecMethod: PatrimonyDeprecMethod.LINEAR,
        usefulLifeYears: 5,
        annualRate: 20,
        assetAccountCode: '1.2.1',
        accumDeprecAccountCode: '1.2.2',
        deprecExpenseAccountCode: '5.3',
      },
      update: {},
    });

    // Localizações
    const locSede = await prisma.patrimonyLocation.upsert({
      where: { clientId_code: { clientId, code: 'SEDE' } },
      create: { clientId, code: 'SEDE', name: 'Sede', type: 'Prédio principal' },
      update: {},
    });

    const locAndar1 = await prisma.patrimonyLocation.upsert({
      where: { clientId_code: { clientId, code: 'SEDE-1' } },
      create: { clientId, code: 'SEDE-1', name: isGama ? '1º Andar — Recepção' : '1º Andar — Escritório', type: 'Sala', parentId: locSede.id },
      update: {},
    });

    const locAndar2 = await prisma.patrimonyLocation.upsert({
      where: { clientId_code: { clientId, code: 'SEDE-2' } },
      create: { clientId, code: 'SEDE-2', name: isGama ? '2º Andar — Consultórios' : '2º Andar — TI', type: 'Sala', parentId: locSede.id },
      update: {},
    });

    const locAlmox = await prisma.patrimonyLocation.upsert({
      where: { clientId_code: { clientId, code: 'ALMOX' } },
      create: { clientId, code: 'ALMOX', name: 'Almoxarifado', type: 'Depósito' },
      update: {},
    });

    // Responsáveis
    const resp1 = await prisma.patrimonyResponsible.create({
      data: {
        clientId,
        name: isGama ? 'Dr. Carlos Henrique' : 'João Silva',
        role: isGama ? 'Diretor Médico' : 'Gerente de TI',
        sector: isGama ? 'Diretoria' : 'Tecnologia',
        email: isGama ? 'carlos@clinicagama.com' : 'joao@betacloud.com',
      },
    }).catch(async () => (await prisma.patrimonyResponsible.findFirst({ where: { clientId, name: isGama ? 'Dr. Carlos Henrique' : 'João Silva' } }))!);

    const resp2 = await prisma.patrimonyResponsible.create({
      data: {
        clientId,
        name: isGama ? 'Ana Paula Ferreira' : 'Maria Souza',
        role: isGama ? 'Gerente Administrativa' : 'Diretora Executiva',
        sector: isGama ? 'Administração' : 'Diretoria',
        email: isGama ? 'ana@clinicagama.com' : 'maria@betacloud.com',
      },
    }).catch(async () => (await prisma.patrimonyResponsible.findFirst({ where: { clientId, name: isGama ? 'Ana Paula Ferreira' : 'Maria Souza' } }))!);

    // Bens com todos os status
    const assetAtivo = await prisma.patrimonyAsset.upsert({
      where: { clientId_tombamento: { clientId, tombamento: isGama ? 'GAMA-0001' : 'BETA-0001' } },
      create: {
        clientId,
        tombamento: isGama ? 'GAMA-0001' : 'BETA-0001',
        internalCode: '001',
        description: isGama ? 'Mesa de Escritório Estação de Trabalho' : 'Mesa de Escritório Executiva',
        brand: 'Plaxmetal',
        model: isGama ? 'Office 180' : 'Executive 160',
        groupId: grpMoveis.id,
        locationId: locAndar1.id,
        responsibleId: resp2.id,
        acquisitionType: PatrimonyAcquisitionType.COMPRA,
        acquisitionDate: new Date('2022-03-15'),
        acquisitionValue: 2500.00,
        residualValue: 250.00,
        usefulLifeMonths: 120,
        usefulLifeMonthsFiscal: 120,
        deprecMethod: PatrimonyDeprecMethod.LINEAR,
        deprecStartDate: new Date('2022-04-01'),
        status: PatrimonyAssetStatus.ATIVO,
        assetAccountCode: '1.2.1',
        accumDeprecAccountCode: '1.2.2',
        deprecExpenseAccountCode: '5.3',
      },
      update: {},
    });

    const assetTi = await prisma.patrimonyAsset.upsert({
      where: { clientId_tombamento: { clientId, tombamento: isGama ? 'GAMA-0002' : 'BETA-0002' } },
      create: {
        clientId,
        tombamento: isGama ? 'GAMA-0002' : 'BETA-0002',
        internalCode: '002',
        description: 'Notebook Dell Latitude 5540',
        brand: 'Dell',
        model: 'Latitude 5540',
        serialNumber: isGama ? 'DLL-2024-001' : 'DLL-2024-002',
        groupId: grpEquipTi.id,
        locationId: locAndar2.id,
        responsibleId: resp1.id,
        acquisitionType: PatrimonyAcquisitionType.COMPRA,
        acquisitionDate: new Date('2024-01-10'),
        acquisitionValue: 8500.00,
        residualValue: 850.00,
        usefulLifeMonths: 60,
        usefulLifeMonthsFiscal: 60,
        deprecMethod: PatrimonyDeprecMethod.LINEAR,
        deprecStartDate: new Date('2024-02-01'),
        status: PatrimonyAssetStatus.ATIVO,
        assetAccountCode: '1.2.1',
        accumDeprecAccountCode: '1.2.2',
        deprecExpenseAccountCode: '5.3',
        documentOrigin: isGama ? 'NF-e 99999/2024' : 'NF-e 88888/2024',
      },
      update: {},
    });

    const assetManut = await prisma.patrimonyAsset.upsert({
      where: { clientId_tombamento: { clientId, tombamento: isGama ? 'GAMA-0003' : 'BETA-0003' } },
      create: {
        clientId,
        tombamento: isGama ? 'GAMA-0003' : 'BETA-0003',
        internalCode: '003',
        description: isGama ? 'Ar Condicionado Split 18.000 BTU' : 'Servidor Dell PowerEdge R350',
        brand: isGama ? 'Daikin' : 'Dell',
        model: isGama ? 'FTXB18AXVJU' : 'PowerEdge R350',
        groupId: isGama ? grpMoveis.id : grpEquipTi.id,
        locationId: locAndar2.id,
        responsibleId: resp1.id,
        acquisitionType: PatrimonyAcquisitionType.COMPRA,
        acquisitionDate: new Date('2021-06-20'),
        acquisitionValue: isGama ? 3800.00 : 25000.00,
        usefulLifeMonths: isGama ? 120 : 60,
        usefulLifeMonthsFiscal: isGama ? 120 : 60,
        deprecMethod: PatrimonyDeprecMethod.LINEAR,
        deprecStartDate: new Date('2021-07-01'),
        status: PatrimonyAssetStatus.EM_MANUTENCAO,
        assetAccountCode: '1.2.1',
        accumDeprecAccountCode: '1.2.2',
        deprecExpenseAccountCode: '5.3',
      },
      update: {},
    });

    const assetOcioso = await prisma.patrimonyAsset.upsert({
      where: { clientId_tombamento: { clientId, tombamento: isGama ? 'GAMA-0004' : 'BETA-0004' } },
      create: {
        clientId,
        tombamento: isGama ? 'GAMA-0004' : 'BETA-0004',
        internalCode: '004',
        description: isGama ? 'Fotocopiadora Xerox Versalink' : 'Impressora HP LaserJet Pro',
        brand: isGama ? 'Xerox' : 'HP',
        model: isGama ? 'Versalink C405' : 'LaserJet Pro M404n',
        groupId: grpEquipTi.id,
        locationId: locAlmox.id,
        acquisitionType: PatrimonyAcquisitionType.COMPRA,
        acquisitionDate: new Date('2019-08-15'),
        acquisitionValue: isGama ? 12000.00 : 3500.00,
        usefulLifeMonths: 60,
        usefulLifeMonthsFiscal: 60,
        deprecMethod: PatrimonyDeprecMethod.LINEAR,
        deprecStartDate: new Date('2019-09-01'),
        deprecSuspended: true,
        status: PatrimonyAssetStatus.OCIOSO,
        assetAccountCode: '1.2.1',
        accumDeprecAccountCode: '1.2.2',
        deprecExpenseAccountCode: '5.3',
      },
      update: {},
    });

    const assetBaixado = await prisma.patrimonyAsset.upsert({
      where: { clientId_tombamento: { clientId, tombamento: isGama ? 'GAMA-0005' : 'BETA-0005' } },
      create: {
        clientId,
        tombamento: isGama ? 'GAMA-0005' : 'BETA-0005',
        internalCode: '005',
        description: isGama ? 'Microcomputador Desktop antigo' : 'Switch de Rede 24 portas (antigo)',
        brand: isGama ? 'Dell' : 'Cisco',
        groupId: grpEquipTi.id,
        locationId: locAlmox.id,
        acquisitionType: PatrimonyAcquisitionType.COMPRA,
        acquisitionDate: new Date('2015-02-10'),
        acquisitionValue: isGama ? 4500.00 : 8000.00,
        usefulLifeMonths: 60,
        usefulLifeMonthsFiscal: 60,
        deprecMethod: PatrimonyDeprecMethod.LINEAR,
        deprecStartDate: new Date('2015-03-01'),
        deprecSuspended: true,
        status: PatrimonyAssetStatus.BAIXADO,
        active: false,
      },
      update: {},
    });

    let assetMedico = null;
    if (isGama && grpEquipMed) {
      assetMedico = await prisma.patrimonyAsset.upsert({
        where: { clientId_tombamento: { clientId, tombamento: 'GAMA-0006' } },
        create: {
          clientId,
          tombamento: 'GAMA-0006',
          internalCode: '006',
          description: 'Tomógrafo Computadorizado Siemens Somatom',
          brand: 'Siemens',
          model: 'Somatom Go.Up',
          serialNumber: 'SMN-2023-TOM-001',
          groupId: grpEquipMed.id,
          locationId: locAndar2.id,
          responsibleId: resp1.id,
          acquisitionType: PatrimonyAcquisitionType.COMPRA,
          acquisitionDate: new Date('2023-06-01'),
          acquisitionValue: 950000.00,
          residualValue: 95000.00,
          usefulLifeMonths: 120,
          usefulLifeMonthsFiscal: 120,
          deprecMethod: PatrimonyDeprecMethod.LINEAR,
          deprecStartDate: new Date('2023-07-01'),
          status: PatrimonyAssetStatus.ATIVO,
          assetAccountCode: '1.2.1',
          accumDeprecAccountCode: '1.2.2',
          deprecExpenseAccountCode: '5.3',
          documentOrigin: 'NF-e 12345/2023',
          technicalNotes: 'Bem sujeito a depreciação acelerada incentivada (Lei 12.794/2013)',
        },
        update: {},
      });
    }

    // Depreciações — ativo TI (jan-mar 2025)
    const monthlyDeprec = (assetTi.acquisitionValue.toNumber() - assetTi.residualValue.toNumber()) / 60;
    for (let m = 1; m <= 3; m++) {
      await prisma.patrimonyDepreciation.upsert({
        where: { assetId_periodYear_periodMonth: { assetId: assetTi.id, periodYear: 2025, periodMonth: m } },
        create: {
          assetId: assetTi.id,
          periodMonth: m,
          periodYear: 2025,
          openingValue: assetTi.acquisitionValue.toNumber() - (monthlyDeprec * (12 + m - 1)),
          accumDeprecOpen: monthlyDeprec * (12 + m - 1),
          monthlyDeprec,
          accumDeprecClose: monthlyDeprec * (12 + m),
          closingValue: assetTi.acquisitionValue.toNumber() - (monthlyDeprec * (12 + m)),
          fiscalDeprec: monthlyDeprec,
        },
        update: {},
      });
    }

    // Depreciação tomógrafo se Gama
    if (assetMedico) {
      const deprecTomo = (assetMedico.acquisitionValue.toNumber() - assetMedico.residualValue.toNumber()) / 120;
      for (let m = 1; m <= 3; m++) {
        await prisma.patrimonyDepreciation.upsert({
          where: { assetId_periodYear_periodMonth: { assetId: assetMedico.id, periodYear: 2025, periodMonth: m } },
          create: {
            assetId: assetMedico.id,
            periodMonth: m,
            periodYear: 2025,
            openingValue: assetMedico.acquisitionValue.toNumber() - (deprecTomo * (18 + m - 1)),
            accumDeprecOpen: deprecTomo * (18 + m - 1),
            monthlyDeprec: deprecTomo,
            accumDeprecClose: deprecTomo * (18 + m),
            closingValue: assetMedico.acquisitionValue.toNumber() - (deprecTomo * (18 + m)),
            fiscalDeprec: deprecTomo * 2,
          },
          update: {},
        });
      }
    }

    // Movimentações de patrimônio
    await prisma.patrimonyMovement.create({
      data: {
        assetId: assetAtivo.id,
        type: 'TRANSFERENCIA_LOCAL' as any,
        movementDate: new Date('2024-06-01'),
        fromLocationId: locAlmox.id,
        toLocationId: locAndar1.id,
        fromResponsibleId: resp2.id,
        toResponsibleId: resp2.id,
        reason: 'Remanejamento para novo layout de escritório',
        document: 'TF-2024/001',
      },
    }).catch(() => null);

    await prisma.patrimonyMovement.create({
      data: {
        assetId: assetManut.id,
        type: 'MUDANCA_STATUS' as any,
        movementDate: new Date('2025-03-10'),
        fromStatus: PatrimonyAssetStatus.ATIVO,
        toStatus: PatrimonyAssetStatus.EM_MANUTENCAO,
        reason: isGama ? 'Manutenção preventiva — filtros e gás' : 'Expansão de memória RAM e disco',
        document: isGama ? 'OS-2025/0123' : 'OS-2025/0456',
      },
    }).catch(() => null);

    await prisma.patrimonyMovement.create({
      data: {
        assetId: assetOcioso.id,
        type: 'MUDANCA_STATUS' as any,
        movementDate: new Date('2024-09-01'),
        fromStatus: PatrimonyAssetStatus.ATIVO,
        toStatus: PatrimonyAssetStatus.OCIOSO,
        reason: 'Substituído por equipamento novo, aguardando destinação',
      },
    }).catch(() => null);

    // Reavaliação
    if (assetMedico) {
      await prisma.patrimonyRevaluation.create({
        data: {
          assetId: assetMedico.id,
          type: PatrimonyRevaluationType.REAVALIACAO,
          revaluationDate: new Date('2024-12-31'),
          previousValue: 950000.00,
          newValue: 980000.00,
          adjustment: 30000.00,
          expertReport: 'LAUDO-2024-TOMO-001',
          accountCode: '1.2.1',
          notes: 'Reavaliação por laudo técnico especializado',
        },
      }).catch(() => null);
    }

    // Baixa do bem baixado
    await prisma.patrimonyDisposal.create({
      data: {
        assetId: assetBaixado.id,
        type: PatrimonyDisposalType.SUCATEAMENTO,
        disposalDate: new Date('2024-03-31'),
        bookValue: 0,
        saleValue: 0,
        gainLoss: 0,
        finalDeprec: 0,
        documentRef: 'BAIXA-2024/001',
        notes: 'Bem totalmente depreciado e sem valor residual. Destinado à reciclagem.',
      },
    }).catch(() => null);

    // Inventário com todos os status
    const invAberto = await prisma.patrimonyInventory.create({
      data: {
        clientId,
        name: 'Inventário Patrimonial 2025 — 1º Semestre',
        startDate: new Date('2025-06-01'),
        status: PatrimonyInventoryStatus.ABERTO,
        notes: 'Inventário semestral obrigatório',
        items: {
          create: [
            { assetId: assetAtivo.id, found: true, foundLocation: locAndar1.id, foundCondition: 'Bom estado', checkedAt: new Date('2025-06-05') },
            { assetId: assetTi.id, found: true, foundLocation: locAndar2.id, foundCondition: 'Excelente', checkedAt: new Date('2025-06-05') },
            { assetId: assetManut.id, found: null },
            { assetId: assetOcioso.id, found: true, foundLocation: locAlmox.id, foundCondition: 'Regular — em almoxarifado', checkedAt: new Date('2025-06-06') },
          ],
        },
      },
    }).catch(() => null);

    const invConcluido = await prisma.patrimonyInventory.create({
      data: {
        clientId,
        name: 'Inventário Patrimonial 2024 — Anual',
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-11-30'),
        status: PatrimonyInventoryStatus.CONCLUIDO,
        notes: 'Inventário anual encerrado com sucesso. Nenhuma divergência encontrada.',
        items: {
          create: [
            { assetId: assetAtivo.id, found: true, foundLocation: locAndar1.id, foundCondition: 'Bom estado', checkedAt: new Date('2024-11-10') },
            { assetId: assetTi.id, found: true, foundLocation: locAndar2.id, foundCondition: 'Excelente', checkedAt: new Date('2024-11-10') },
            { assetId: assetManut.id, found: true, foundLocation: locAndar2.id, foundCondition: 'Operacional', checkedAt: new Date('2024-11-12') },
            { assetId: assetOcioso.id, found: true, foundLocation: locAlmox.id, foundCondition: 'Parado', checkedAt: new Date('2024-11-15') },
          ],
        },
      },
    }).catch(() => null);
  }

  console.log('  ✓ Dados de patrimônio criados');
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
