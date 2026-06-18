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

// ── Fiscal ─────────────────────────────────────────────────────────────────

export type FiscalProduct = {
  id: string;
  clientId: string;
  internalCode: string;
  description: string;
  unitOfMeasure: string;
  barcode?: string | null;
  ncm: string;
  cest?: string | null;
  group?: string | null;
  subgroup?: string | null;
  cfopInbound?: string | null;
  cfopOutbound?: string | null;
  cstIcms?: string | null;
  csosnIcms?: string | null;
  cstIpi?: string | null;
  cstPisCofins?: string | null;
  icmsInternalRate?: string | null;
  icmsInterstateRate?: string | null;
  icmsStRate?: string | null;
  ipiRate?: string | null;
  pisRate?: string | null;
  cofinsRate?: string | null;
  generatesPisCofinsCredit: boolean;
  isMonophasic: boolean;
  isSubjectToSt: boolean;
  generatesDifal: boolean;
  isImported: boolean;
  isFuel: boolean;
  isEnergy: boolean;
  isCommunication: boolean;
  isTransport: boolean;
  isForConsumption: boolean;
  isForResale: boolean;
  isFixedAsset: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FiscalProductPayload = Omit<FiscalProduct, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>;

export type FiscalService = {
  id: string;
  clientId: string;
  internalCode: string;
  description: string;
  municipalCode?: string | null;
  lc116Code?: string | null;
  issRate?: string | null;
  issOwnRule: boolean;
  issRetainedRule: boolean;
  issSubstituteRule: boolean;
  hasInssRetention: boolean;
  hasIrrfRetention: boolean;
  hasCsllRetention: boolean;
  hasPisRetention: boolean;
  hasCofinsRetention: boolean;
  isServiceExport: boolean;
  incidenceMunicipality?: 'PRESTADOR' | 'TOMADOR' | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FiscalServicePayload = Omit<FiscalService, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>;

export type CfopEntry = {
  id: string;
  code: string;
  description: string;
  operationType: 'ENTRADA' | 'SAIDA';
  creditImpact?: string | null;
  active: boolean;
};

export type CstEntry = {
  id: string;
  code: string;
  description: string;
  taxType: 'ICMS' | 'IPI' | 'PIS_COFINS' | 'CSOSN';
  entryExit?: 'ENTRADA' | 'SAIDA' | 'AMBOS' | null;
  active: boolean;
};

export type NcmEntry = {
  code: string;
  description: string;
  validFrom?: string | null;
  validUntil?: string | null;
};

export type CestEntry = {
  code: string;
  ncm: string;
  description: string;
};

export type OperationNature = {
  id: string;
  clientId?: string | null;
  code: string;
  description: string;
  cfop: string;
  active: boolean;
  createdAt: string;
};

// ── Escrituração fiscal ────────────────────────────────────────────────────

export type FiscalDocumentType = 'NF_E' | 'NFC_E' | 'CT_E' | 'NFS_E' | 'PRODUTOR' | 'ENERGIA' | 'TELECOM' | 'COMBUSTIVEL' | 'OUTRO';
export type FiscalEntryExit = 'ENTRADA' | 'SAIDA';
export type FiscalDocumentStatus = 'REGULAR' | 'CANCELADA' | 'INUTILIZADA' | 'DENEGADA';
export type FiscalDocumentOrigin = 'XML_IMPORTADO' | 'DIGITACAO_MANUAL' | 'IMPORTACAO_AUTOMATICA';
export type ValidationStatus = 'PENDENTE' | 'VALIDO' | 'DIVERGENTE' | 'ERRO';

export type FiscalDocumentItem = {
  id: string;
  documentId: string;
  itemNumber: number;
  productCode?: string | null;
  description: string;
  ncm?: string | null;
  cfop: string;
  unitOfMeasure?: string | null;
  quantity: string;
  unitValue: string;
  totalValue: string;
  discount: string;
  cstIcms?: string | null;
  csosnIcms?: string | null;
  cstIpi?: string | null;
  cstPisCofins?: string | null;
  baseIcms: string;
  icmsRate: string;
  valueIcms: string;
  baseIcmsSt: string;
  icmsStRate: string;
  valueIcmsSt: string;
  ipiRate: string;
  valueIpi: string;
  pisRate: string;
  valuePis: string;
  cofinsRate: string;
  valueCofins: string;
  allowsCredit: boolean;
};

export type FiscalDocumentItemInput = {
  itemNumber: number;
  productCode?: string | null;
  description: string;
  ncm?: string | null;
  cfop: string;
  unitOfMeasure?: string | null;
  quantity: number;
  unitValue: number;
  totalValue: number;
  discount?: number;
  cstIcms?: string | null;
  csosnIcms?: string | null;
  cstIpi?: string | null;
  cstPisCofins?: string | null;
  baseIcms?: number;
  icmsRate?: number;
  valueIcms?: number;
  baseIcmsSt?: number;
  icmsStRate?: number;
  valueIcmsSt?: number;
  ipiRate?: number;
  valueIpi?: number;
  pisRate?: number;
  valuePis?: number;
  cofinsRate?: number;
  valueCofins?: number;
  allowsCredit?: boolean;
};

export type ValidationError = {
  field: string;
  message: string;
  severity: 'ERRO' | 'AVISO';
};

export type FiscalDocument = {
  id: string;
  clientId: string;
  documentType: FiscalDocumentType;
  entryExit: FiscalEntryExit;
  status: FiscalDocumentStatus;
  origin: FiscalDocumentOrigin;
  documentNumber: string;
  series?: string | null;
  accessKey?: string | null;
  issueDate: string;
  entryExitDate?: string | null;
  cnpjIssuer: string;
  nameIssuer: string;
  stateRegIssuer?: string | null;
  ufIssuer?: string | null;
  cnpjRecipient?: string | null;
  nameRecipient?: string | null;
  stateRegRecipient?: string | null;
  ufRecipient?: string | null;
  totalProducts: string;
  totalDocument: string;
  totalFreight: string;
  totalInsurance: string;
  totalDiscount: string;
  totalOther: string;
  baseIcms: string;
  valueIcms: string;
  baseIcmsSt: string;
  valueIcmsSt: string;
  valueIpi: string;
  valuePis: string;
  valueCofins: string;
  baseIss: string;
  valueIss: string;
  valueIssRetained: string;
  valueInss: string;
  valueIrrf: string;
  valueCsll: string;
  validationStatus: ValidationStatus;
  validationErrors?: ValidationError[] | null;
  notes?: string | null;
  periodMonth?: number | null;
  periodYear?: number | null;
  createdAt: string;
  updatedAt: string;
  items?: FiscalDocumentItem[];
  createdBy?: { id: string; name: string } | null;
  _count?: { items: number };
};

// ── Apuração de tributos ───────────────────────────────────────────────────

// ── Módulo Contábil ────────────────────────────────────────────────────────

export type AccountType = 'SINTETICA' | 'ANALITICA';
export type AccountNature = 'DEVEDORA' | 'CREDORA';
export type AccountClass = 'ATIVO' | 'PASSIVO' | 'PATRIMONIO_LIQUIDO' | 'RECEITA' | 'DESPESA' | 'CUSTO' | 'RESULTADO';
export type CostCenterType = 'ADMINISTRATIVO' | 'OPERACIONAL' | 'PROJETO' | 'UNIDADE';
export type EntryTypeClass = 'NORMAL' | 'PROVISAO' | 'RECLASSIFICACAO' | 'ENCERRAMENTO' | 'AJUSTE';
export type ClosingMethod = 'AUTOMATICO' | 'MANUAL';

export type AccountingPlan = {
  id: string;
  clientId: string;
  code: string;
  name: string;
  type: AccountType;
  nature: AccountNature;
  classification: AccountClass;
  level: number;
  parentId?: string | null;
  allowsEntry: boolean;
  usesCostCenter: boolean;
  usesStdHistory: boolean;
  integratesModules: boolean;
  spedRefCode?: string | null;
  ecfRefCode?: string | null;
  notes?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: { id: string; code: string; name: string } | null;
  children?: { id: string; code: string; name: string; type: AccountType; active: boolean }[];
};

export type AccountingPlanPayload = {
  clientId: string;
  code: string;
  name: string;
  type: AccountType;
  nature: AccountNature;
  classification: AccountClass;
  parentId?: string | null;
  allowsEntry?: boolean;
  usesCostCenter?: boolean;
  usesStdHistory?: boolean;
  integratesModules?: boolean;
  spedRefCode?: string | null;
  ecfRefCode?: string | null;
  notes?: string | null;
};

export type CostCenter = {
  id: string;
  clientId: string;
  code: string;
  name: string;
  type: CostCenterType;
  level: number;
  parentId?: string | null;
  required: boolean;
  active: boolean;
  notes?: string | null;
  createdAt: string;
  parent?: { id: string; code: string; name: string } | null;
  children?: { id: string; code: string; name: string }[];
};

export type StandardHistory = {
  id: string;
  clientId: string;
  code: string;
  text: string;
  complement?: string | null;
  active: boolean;
  createdAt: string;
};

export type EntryType = {
  id: string;
  clientId: string;
  code: string;
  name: string;
  classification: EntryTypeClass;
  appearsInReports: boolean;
  allowsReversal: boolean;
  active: boolean;
  notes?: string | null;
  createdAt: string;
};

export type AccountingParameters = {
  id: string;
  clientId: string;
  closingMethod: ClosingMethod;
  costCenterRequired: boolean;
  integrateFiscal: boolean;
  integratePayroll: boolean;
  integrateFinancial: boolean;
  integratePatrimony: boolean;
  integrateBilling: boolean;
  closedPeriods: string[];
  currentYear?: number | null;
  resultAccountId?: string | null;
  retainedEarningsAccId?: string | null;
  createdAt: string;
  updatedAt: string;
};

// ── Lançamentos Contábeis ─────────────────────────────────────────────────

export type EntryStatus = 'RASCUNHO' | 'CONFIRMADO' | 'ESTORNADO';
export type EntrySource = 'MANUAL' | 'FISCAL' | 'FOLHA' | 'FINANCEIRO' | 'ESTORNO';
export type DebitCredit = 'DEBITO' | 'CREDITO';

export type AccountingEntryLine = {
  id: string;
  entryId: string;
  lineNumber: number;
  accountId: string;
  costCenterId?: string | null;
  historyId?: string | null;
  complement?: string | null;
  debitCredit: DebitCredit;
  value: string;
};

export type AccountingEntry = {
  id: string;
  clientId: string;
  entryNumber: number;
  entryDate: string;
  periodMonth: number;
  periodYear: number;
  description: string;
  entryTypeId?: string | null;
  status: EntryStatus;
  source: EntrySource;
  reversedById?: string | null;
  documentRef?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string } | null;
  lines: AccountingEntryLine[];
};

export type AccountingEntryListResult = {
  data: AccountingEntry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type AccountingEntryLineInput = {
  lineNumber: number;
  accountId: string;
  costCenterId?: string | null;
  historyId?: string | null;
  complement?: string | null;
  debitCredit: DebitCredit;
  value: number;
};

export type CreateAccountingEntryPayload = {
  clientId: string;
  entryDate: string;
  description: string;
  entryTypeId?: string | null;
  source?: EntrySource;
  documentRef?: string | null;
  lines: AccountingEntryLineInput[];
};

export type LedgerLine = AccountingEntryLine & {
  entry: { entryNumber: number; entryDate: string; description: string; status: EntryStatus };
  runningBalance: number;
};

export type TrialBalanceLine = {
  account: AccountingPlan;
  debits: number;
  credits: number;
  balance: number;
};

// ── Obrigações e livros fiscais ────────────────────────────────────────────

export type ObligationType =
  | 'SPED_FISCAL'
  | 'SPED_CONTRIBUICOES'
  | 'REINF'
  | 'DCTF'
  | 'PGDAS'
  | 'DAS'
  | 'DIRF'
  | 'NFSE_MUNICIPAL'
  | 'OUTRA';

export type ObligationStatus = 'PENDENTE' | 'GERADA' | 'TRANSMITIDA' | 'ERRO' | 'DISPENSADA';

export type BookType =
  | 'ENTRADAS'
  | 'SAIDAS'
  | 'APURACAO_ICMS'
  | 'APURACAO_IPI'
  | 'APURACAO_PIS_COFINS'
  | 'APURACAO_ISS';

export type FiscalObligation = {
  id: string;
  clientId: string;
  type: ObligationType;
  periodMonth: number;
  periodYear: number;
  dueDate?: string | null;
  status: ObligationStatus;
  notes?: string | null;
  fileName?: string | null;
  errorMessage?: string | null;
  generatedAt?: string | null;
  transmittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FiscalBook = {
  id: string;
  clientId: string;
  bookType: BookType;
  periodMonth: number;
  periodYear: number;
  generatedAt: string;
  totalEntries: number;
  totalSaidas: number;
  totalValueEntries: string;
  totalValueSaidas: string;
  totalIcms: string;
  totalIpi: string;
  totalPis: string;
  totalCofins: string;
  totalIss: string;
};

export type TaxApurationType = 'ICMS' | 'IPI' | 'PIS_COFINS' | 'ISS' | 'SIMPLES_NACIONAL';
export type ApurationStatus = 'ABERTA' | 'CALCULADA' | 'ENCERRADA';
export type AdjustmentType =
  | 'OUTROS_CREDITOS'
  | 'OUTROS_DEBITOS'
  | 'ESTORNO_CREDITO'
  | 'ESTORNO_DEBITO'
  | 'INCENTIVO_FISCAL'
  | 'DEDUCAO';

export type TaxApurationResult = {
  id: string;
  apurationId: string;
  // ICMS / IPI
  totalDebits: string;
  totalCredits: string;
  totalStDebits: string;
  totalStCredits: string;
  totalDifal: string;
  totalPartilha: string;
  totalAdjustments: string;
  previousBalance: string;
  balance: string;
  taxDue: string;
  nextBalance: string;
  // PIS/COFINS
  pisRevenue: string;
  pisDebits: string;
  pisCredits: string;
  pisNet: string;
  cofinsRevenue: string;
  cofinsDebits: string;
  cofinsCredits: string;
  cofinsNet: string;
  // ISS
  issOwn: string;
  issRetained: string;
  issSubstitute: string;
  issNet: string;
  // Simples
  simplesRbcTotal: string;
  simplesRbcAcum: string;
  simplesAliquota: string;
  simplesTotalDue: string;
  calculatedAt: string;
};

export type TaxApurationAdjustment = {
  id: string;
  apurationId: string;
  type: AdjustmentType;
  description: string;
  value: string;
  documentRef?: string | null;
  createdAt: string;
};

export type TaxApurationSimplesRevenue = {
  id: string;
  apurationId: string;
  annex: string;
  totalRevenue: string;
  revenueWithSt: string;
  revenueMonophasic: string;
  revenueIssRetained: string;
  netRevenue: string;
};

export type TaxApuration = {
  id: string;
  clientId: string;
  taxType: TaxApurationType;
  periodMonth: number;
  periodYear: number;
  status: ApurationStatus;
  notes?: string | null;
  calculatedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; companyName: string; tradeName?: string | null };
  createdBy?: { id: string; name: string } | null;
  result?: TaxApurationResult | null;
  adjustments?: TaxApurationAdjustment[];
  simplesRevenues?: TaxApurationSimplesRevenue[];
  _count?: { adjustments: number; simplesRevenues: number };
};

export type TaxApurationPayload = {
  clientId: string;
  taxType: TaxApurationType;
  periodMonth: number;
  periodYear: number;
  notes?: string;
  simplesRevenues?: {
    annex: string;
    totalRevenue: number;
    revenueWithSt?: number;
    revenueMonophasic?: number;
    revenueIssRetained?: number;
  }[];
};

export type FiscalDocumentPayload = {
  clientId: string;
  documentType: FiscalDocumentType;
  entryExit: FiscalEntryExit;
  status?: FiscalDocumentStatus;
  documentNumber: string;
  series?: string | null;
  accessKey?: string | null;
  issueDate: string;
  entryExitDate?: string | null;
  cnpjIssuer: string;
  nameIssuer: string;
  stateRegIssuer?: string | null;
  ufIssuer?: string | null;
  cnpjRecipient?: string | null;
  nameRecipient?: string | null;
  stateRegRecipient?: string | null;
  ufRecipient?: string | null;
  totalProducts?: number;
  totalDocument?: number;
  totalFreight?: number;
  totalInsurance?: number;
  totalDiscount?: number;
  totalOther?: number;
  baseIcms?: number;
  valueIcms?: number;
  baseIcmsSt?: number;
  valueIcmsSt?: number;
  valueIpi?: number;
  valuePis?: number;
  valueCofins?: number;
  baseIss?: number;
  valueIss?: number;
  valueIssRetained?: number;
  valueInss?: number;
  valueIrrf?: number;
  valueCsll?: number;
  notes?: string | null;
  periodMonth?: number;
  periodYear?: number;
  items: FiscalDocumentItemInput[];
};
