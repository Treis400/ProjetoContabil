import { api } from './api';
import type {
  AccountingPlan,
  AccountingPlanPayload,
  CostCenter,
  StandardHistory,
  EntryType,
  AccountingParameters,
  AccountingEntry,
  AccountingEntryListResult,
  CreateAccountingEntryPayload,
  LedgerLine,
  TrialBalanceLine,
} from '../types';

const BASE = '/contabil';

// ── Plano de Contas ───────────────────────────────────────────────────────────

export async function fetchAccounts(clientId: string, classification?: string): Promise<AccountingPlan[]> {
  const { data } = await api.get(`${BASE}/plano-contas`, { params: { clientId, classification } });
  return data;
}

export async function fetchAccount(id: string): Promise<AccountingPlan> {
  const { data } = await api.get(`${BASE}/plano-contas/${id}`);
  return data;
}

export async function createAccountApi(payload: AccountingPlanPayload): Promise<AccountingPlan> {
  const { data } = await api.post(`${BASE}/plano-contas`, payload);
  return data;
}

export async function updateAccountApi(id: string, payload: Partial<AccountingPlanPayload>): Promise<AccountingPlan> {
  const { data } = await api.put(`${BASE}/plano-contas/${id}`, payload);
  return data;
}

export async function deleteAccountApi(id: string): Promise<void> {
  await api.delete(`${BASE}/plano-contas/${id}`);
}

export async function importDefaultPlanApi(clientId: string): Promise<{ imported: number }> {
  const { data } = await api.post(`${BASE}/plano-contas/importar`, { clientId });
  return data;
}

// ── Centros de Custo ──────────────────────────────────────────────────────────

export async function fetchCostCenters(clientId: string): Promise<CostCenter[]> {
  const { data } = await api.get(`${BASE}/centros-custo`, { params: { clientId } });
  return data;
}

export async function createCostCenterApi(payload: {
  clientId: string; code: string; name: string; type: string;
  level?: number; parentId?: string | null; required?: boolean; notes?: string;
}): Promise<CostCenter> {
  const { data } = await api.post(`${BASE}/centros-custo`, payload);
  return data;
}

export async function updateCostCenterApi(id: string, payload: Partial<{
  code: string; name: string; type: string; required: boolean; active: boolean; notes: string;
}>): Promise<CostCenter> {
  const { data } = await api.put(`${BASE}/centros-custo/${id}`, payload);
  return data;
}

export async function deleteCostCenterApi(id: string): Promise<void> {
  await api.delete(`${BASE}/centros-custo/${id}`);
}

// ── Históricos Padrão ─────────────────────────────────────────────────────────

export async function fetchStandardHistories(clientId: string, search?: string): Promise<StandardHistory[]> {
  const { data } = await api.get(`${BASE}/historicos`, { params: { clientId, search } });
  return data;
}

export async function createStandardHistoryApi(payload: {
  clientId: string; code: string; text: string; complement?: string;
}): Promise<StandardHistory> {
  const { data } = await api.post(`${BASE}/historicos`, payload);
  return data;
}

export async function updateStandardHistoryApi(id: string, payload: Partial<{
  code: string; text: string; complement: string; active: boolean;
}>): Promise<StandardHistory> {
  const { data } = await api.put(`${BASE}/historicos/${id}`, payload);
  return data;
}

export async function deleteStandardHistoryApi(id: string): Promise<void> {
  await api.delete(`${BASE}/historicos/${id}`);
}

// ── Tipos de Lançamento ───────────────────────────────────────────────────────

export async function fetchEntryTypes(clientId: string): Promise<EntryType[]> {
  const { data } = await api.get(`${BASE}/tipos-lancamento`, { params: { clientId } });
  return data;
}

export async function createEntryTypeApi(payload: {
  clientId: string; code: string; name: string; classification: string;
  appearsInReports?: boolean; allowsReversal?: boolean; notes?: string;
}): Promise<EntryType> {
  const { data } = await api.post(`${BASE}/tipos-lancamento`, payload);
  return data;
}

export async function updateEntryTypeApi(id: string, payload: Partial<{
  code: string; name: string; classification: string;
  appearsInReports: boolean; allowsReversal: boolean; active: boolean; notes: string;
}>): Promise<EntryType> {
  const { data } = await api.put(`${BASE}/tipos-lancamento/${id}`, payload);
  return data;
}

export async function deleteEntryTypeApi(id: string): Promise<void> {
  await api.delete(`${BASE}/tipos-lancamento/${id}`);
}

// ── Parâmetros Contábeis ──────────────────────────────────────────────────────

export async function fetchAccountingParameters(clientId: string): Promise<AccountingParameters | null> {
  const { data } = await api.get(`${BASE}/parametros`, { params: { clientId } });
  return data;
}

export async function upsertAccountingParametersApi(payload: Partial<AccountingParameters> & { clientId: string }): Promise<AccountingParameters> {
  const { data } = await api.post(`${BASE}/parametros`, payload);
  return data;
}

export async function togglePeriodApi(clientId: string, period: string): Promise<AccountingParameters> {
  const { data } = await api.post(`${BASE}/parametros/periodo`, { clientId, period });
  return data;
}

// ── Lançamentos Contábeis ─────────────────────────────────────────────────────

const ENTRY_BASE = '/contabil/lancamentos';

export async function fetchEntries(params: {
  clientId: string;
  periodMonth?: number;
  periodYear?: number;
  status?: string;
  accountId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AccountingEntryListResult> {
  const { data } = await api.get(ENTRY_BASE, { params });
  return data;
}

export async function fetchEntry(id: string): Promise<AccountingEntry> {
  const { data } = await api.get(`${ENTRY_BASE}/${id}`);
  return data;
}

export async function createEntryApi(payload: CreateAccountingEntryPayload): Promise<AccountingEntry> {
  const { data } = await api.post(ENTRY_BASE, payload);
  return data;
}

export async function updateEntryApi(id: string, payload: Partial<CreateAccountingEntryPayload>): Promise<AccountingEntry> {
  const { data } = await api.put(`${ENTRY_BASE}/${id}`, payload);
  return data;
}

export async function reverseEntryApi(id: string): Promise<AccountingEntry> {
  const { data } = await api.post(`${ENTRY_BASE}/${id}/estornar`);
  return data;
}

export async function deleteEntryApi(id: string): Promise<void> {
  await api.delete(`${ENTRY_BASE}/${id}`);
}

export async function fetchLedger(params: {
  clientId: string;
  accountId: string;
  periodMonth?: number;
  periodYear?: number;
}): Promise<LedgerLine[]> {
  const { data } = await api.get(`${ENTRY_BASE}/razao`, { params });
  return data;
}

export async function fetchTrialBalance(params: {
  clientId: string;
  periodMonth?: number;
  periodYear?: number;
}): Promise<TrialBalanceLine[]> {
  const { data } = await api.get(`${ENTRY_BASE}/balancete`, { params });
  return data;
}
