export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type ClientService = {
  id?: string;
  serviceType: string;
  description?: string | null;
};

export type ClientMonthlyFee = {
  amount: number;
  startDate: string;
  status: 'ATIVO' | 'SUSPENSO' | 'ENCERRADO';
};

export type ClientPayload = {
  companyName: string;
  tradeName?: string | null;
  cnpj: string;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  mainCnae?: string | null;
  taxRegime?: string | null;
  openingDate?: string | null;
  companyStatus: 'ATIVA' | 'SUSPENSA' | 'INATIVA' | 'ENCERRADA';
  legalRepresentative?: string | null;
  legalRepresentativeCpf?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  fullAddress?: string | null;
  internalNotes?: string | null;
  taxProfile: {
    companyType: 'MEI' | 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
    cityHall?: string | null;
    regulatoryAgency?: string | null;
    digitalCertificate?: string | null;
    digitalCertificateExpiry?: string | null;
    currentTaxSituation?:
      | 'SIMPLES_NACIONAL_ATIVO'
      | 'SIMPLES_NACIONAL_EXCLUIDO'
      | 'MEI_ATIVO'
      | 'MEI_DESENQUADRADO'
      | 'LUCRO_PRESUMIDO'
      | 'LUCRO_REAL'
      | null;
  };
  services: ClientService[];
  monthlyFee: ClientMonthlyFee;
};

export type Client = ClientPayload & {
  id: string;
  createdAt: string;
  updatedAt: string;
  services: ClientService[];
  taxProfile: ClientPayload['taxProfile'];
  monthlyFees?: Array<{
    id: string;
    amount: string;
    startDate: string;
    status: string;
    isCurrent: boolean;
    adjustments: Array<{
      id: string;
      previousAmount: string;
      newAmount: string;
      effectiveDate: string;
    }>;
  }>;
  changeLogs?: Array<{
    id: string;
    fieldName: string;
    oldValue?: string | null;
    newValue?: string | null;
    createdAt: string;
    user: { name: string; email: string };
  }>;
  documents?: DocumentItem[];
  _count?: {
    processes: number;
    documents: number;
  };
};

export type ProcessInstallment = {
  sequence: number;
  dueDate: string;
  amount: number;
  status: 'PENDENTE' | 'PARCIAL' | 'PAGO';
  paidAt?: string | null;
};

export type ProcessPayload = {
  clientId: string;
  title: string;
  description?: string | null;
  type:
    | 'ABERTURA_EMPRESA'
    | 'ALTERACAO_EMPRESA'
    | 'ENCERRAMENTO_EMPRESA'
    | 'FISCAL'
    | 'DP'
    | 'IMPOSTO_RENDA'
    | 'OUTRO';
  status: 'ESCRITORIO_EXECUTANDO' | 'PARADO_COM_CLIENTE' | 'CONCLUIDO';
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  responsibleId?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  flowTemplateId?: string | null;
  fee?: {
    totalAmount: number;
    paymentMethod:
      | 'PIX'
      | 'BOLETO'
      | 'DINHEIRO'
      | 'CARTAO_CREDITO'
      | 'CARTAO_DEBITO'
      | 'TRANSFERENCIA'
      | 'OUTRO';
    installmentsCount: number;
    paymentStatus: 'PENDENTE' | 'PARCIAL' | 'PAGO';
    installments: ProcessInstallment[];
  } | null;
  pendingIssues?: Array<{
    type:
      | 'DEBITO_TRIBUTARIO'
      | 'OBRIGACAO_ACESSORIA_ATRASADA'
      | 'FALTA_DOCUMENTO'
      | 'PENDENCIA_MUNICIPAL'
      | 'PENDENCIA_ESTADUAL'
      | 'ORGAO_REGULADOR'
      | 'OUTRA';
    description: string;
  }>;
  closureData?: {
    closureEffectiveDate?: string | null;
    protocolNumber?: string | null;
    finalNotes?: string | null;
  } | null;
};

export type Process = Omit<ProcessPayload, 'fee' | 'pendingIssues' | 'closureData'> & {
  id: string;
  flowTemplateId?: string | null;
  client: Client;
  responsible?: { id: string; name: string } | null;
  steps: Array<{
    id: string;
    title: string;
    orderIndex: number;
    status: 'PENDENTE' | 'EM_ANDAMENTO' | 'AGUARDANDO_CLIENTE' | 'CONCLUIDO';
    dueDate?: string | null;
    notes?: string | null;
  }>;
  movements?: Array<{
    id: string;
    description: string;
    createdAt: string;
    user: { name: string };
  }>;
  pendingIssues?: Array<{
    id: string;
    type: string;
    description: string;
    resolved: boolean;
  }>;
  fee?: {
    id: string;
    totalAmount: string;
    paymentMethod: string;
    installmentsCount: number;
    paymentStatus: string;
    installments: Array<{
      id: string;
      sequence: number;
      dueDate: string;
      amount: string;
      status: string;
    }>;
  } | null;
  documents?: DocumentItem[];
  closureEffectiveDate?: string | null;
  protocolNumber?: string | null;
  finalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentItem = {
  id: string;
  originalName: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  entityType: 'CLIENT' | 'PROCESS';
  clientId?: string | null;
  processId?: string | null;
  createdAt: string;
  client?: { companyName: string } | null;
  process?: { title: string } | null;
  uploadedBy?: { name: string; email: string } | null;
};

export type DashboardSummary = {
  cards: {
    processosEmAndamento: number;
    processosParadosCliente: number;
    processosConcluidos: number;
    processosAtrasados: number;
    processosProximosVencimento: number;
    empresasSimplesNacional: number;
    empresasMei: number;
    revisoesTributariasPendentes: number;
  };
  processosPorResponsavel: Array<{
    responsibleId: string | null;
    responsibleName: string;
    count: number;
  }>;
};

export type TaxReview = {
  id: string;
  clientId: string;
  year: number;
  status: string;
  verificationDate: string;
  notes?: string | null;
  client: Client;
  reviewedBy: { name: string; email: string };
};

export type Alert = {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description?: string | null;
  dueDate?: string | null;
  resolved: boolean;
  createdAt: string;
  client?: Client | null;
  process?: Process | null;
};
