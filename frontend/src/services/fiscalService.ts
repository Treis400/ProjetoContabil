import { api } from './api';
import type {
  CestEntry,
  CfopEntry,
  CstEntry,
  FiscalDocument,
  FiscalDocumentPayload,
  FiscalEntryExit,
  FiscalProduct,
  FiscalProductPayload,
  FiscalService,
  FiscalServicePayload,
  NcmEntry,
  OperationNature,
  TaxApuration,
  TaxApurationPayload,
  TaxApurationAdjustment,
  TaxApurationSimplesRevenue,
  FiscalObligation,
  FiscalBook,
} from '../types';

// Produtos fiscais
export async function fetchFiscalProducts(clientId: string, search?: string): Promise<FiscalProduct[]> {
  const { data } = await api.get(`/fiscal/clients/${clientId}/fiscal-products`, { params: { search } });
  return data;
}

export async function fetchFiscalProduct(id: string): Promise<FiscalProduct> {
  const { data } = await api.get(`/fiscal/fiscal-products/${id}`);
  return data;
}

export async function createFiscalProduct(clientId: string, payload: FiscalProductPayload): Promise<FiscalProduct> {
  const { data } = await api.post(`/fiscal/clients/${clientId}/fiscal-products`, payload);
  return data;
}

export async function updateFiscalProduct(id: string, payload: Partial<FiscalProductPayload>): Promise<FiscalProduct> {
  const { data } = await api.put(`/fiscal/fiscal-products/${id}`, payload);
  return data;
}

export async function deleteFiscalProduct(id: string): Promise<void> {
  await api.delete(`/fiscal/fiscal-products/${id}`);
}

// Serviços fiscais
export async function fetchFiscalServices(clientId: string, search?: string): Promise<FiscalService[]> {
  const { data } = await api.get(`/fiscal/clients/${clientId}/fiscal-services`, { params: { search } });
  return data;
}

export async function fetchFiscalService(id: string): Promise<FiscalService> {
  const { data } = await api.get(`/fiscal/fiscal-services/${id}`);
  return data;
}

export async function createFiscalService(clientId: string, payload: FiscalServicePayload): Promise<FiscalService> {
  const { data } = await api.post(`/fiscal/clients/${clientId}/fiscal-services`, payload);
  return data;
}

export async function updateFiscalService(id: string, payload: Partial<FiscalServicePayload>): Promise<FiscalService> {
  const { data } = await api.put(`/fiscal/fiscal-services/${id}`, payload);
  return data;
}

export async function deleteFiscalService(id: string): Promise<void> {
  await api.delete(`/fiscal/fiscal-services/${id}`);
}

// Tabelas auxiliares
export async function fetchCfop(operationType?: 'ENTRADA' | 'SAIDA', search?: string): Promise<CfopEntry[]> {
  const { data } = await api.get('/fiscal/cfop', { params: { operationType, search } });
  return data;
}

export async function upsertCfop(payload: Omit<CfopEntry, 'id'>): Promise<CfopEntry> {
  const { data } = await api.post('/fiscal/cfop', payload);
  return data;
}

export async function deleteCfop(id: string): Promise<void> {
  await api.delete(`/fiscal/cfop/${id}`);
}

export async function fetchCst(taxType?: string, search?: string): Promise<CstEntry[]> {
  const { data } = await api.get('/fiscal/cst', { params: { taxType, search } });
  return data;
}

export async function fetchNcm(search?: string): Promise<NcmEntry[]> {
  const { data } = await api.get('/fiscal/ncm', { params: { search } });
  return data;
}

export async function fetchCest(ncm?: string, search?: string): Promise<CestEntry[]> {
  const { data } = await api.get('/fiscal/cest', { params: { ncm, search } });
  return data;
}

export async function fetchOperationNatures(clientId?: string, search?: string): Promise<OperationNature[]> {
  const { data } = await api.get('/fiscal/operation-natures', { params: { clientId, search } });
  return data;
}

export async function createOperationNature(payload: Omit<OperationNature, 'id' | 'createdAt'>): Promise<OperationNature> {
  const { data } = await api.post('/fiscal/operation-natures', payload);
  return data;
}

export async function updateOperationNature(id: string, payload: Partial<OperationNature>): Promise<OperationNature> {
  const { data } = await api.put(`/fiscal/operation-natures/${id}`, payload);
  return data;
}

export async function deleteOperationNature(id: string): Promise<void> {
  await api.delete(`/fiscal/operation-natures/${id}`);
}

// Documentos fiscais
export type DocumentFilters = {
  clientId: string;
  entryExit?: FiscalEntryExit;
  documentType?: string;
  status?: string;
  periodYear?: number;
  periodMonth?: number;
  search?: string;
};

export async function fetchFiscalDocuments(filters: DocumentFilters): Promise<FiscalDocument[]> {
  const { data } = await api.get('/fiscal/documents', { params: filters });
  return data;
}

export async function fetchFiscalDocument(id: string): Promise<FiscalDocument> {
  const { data } = await api.get(`/fiscal/documents/${id}`);
  return data;
}

export async function createFiscalDocument(payload: FiscalDocumentPayload): Promise<FiscalDocument> {
  const { data } = await api.post('/fiscal/documents', payload);
  return data;
}

export async function importFiscalDocumentXml(payload: {
  clientId: string;
  entryExit: FiscalEntryExit;
  xmlContent: string;
}): Promise<FiscalDocument> {
  const { data } = await api.post('/fiscal/documents/import-xml', payload);
  return data;
}

export async function updateFiscalDocumentStatus(id: string, status: string): Promise<FiscalDocument> {
  const { data } = await api.patch(`/fiscal/documents/${id}/status`, { status });
  return data;
}

export async function revalidateFiscalDocument(id: string): Promise<FiscalDocument> {
  const { data } = await api.post(`/fiscal/documents/${id}/revalidate`);
  return data;
}

export async function deleteFiscalDocumentApi(id: string): Promise<void> {
  await api.delete(`/fiscal/documents/${id}`);
}

// ── Apuração de tributos ───────────────────────────────────────────────────

export async function fetchApurations(clientId: string, year?: number): Promise<TaxApuration[]> {
  const { data } = await api.get('/fiscal/apuracoes', { params: { clientId, year } });
  return data;
}

export async function fetchApuration(id: string): Promise<TaxApuration> {
  const { data } = await api.get(`/fiscal/apuracoes/${id}`);
  return data;
}

export async function createApurationApi(payload: TaxApurationPayload): Promise<TaxApuration> {
  const { data } = await api.post('/fiscal/apuracoes', payload);
  return data;
}

export async function calcApurationApi(id: string): Promise<TaxApuration> {
  const { data } = await api.post(`/fiscal/apuracoes/${id}/calcular`);
  return data;
}

export async function closeApurationApi(id: string): Promise<TaxApuration> {
  const { data } = await api.post(`/fiscal/apuracoes/${id}/encerrar`);
  return data;
}

export async function reopenApurationApi(id: string): Promise<TaxApuration> {
  const { data } = await api.post(`/fiscal/apuracoes/${id}/reabrir`);
  return data;
}

export async function deleteApurationApi(id: string): Promise<void> {
  await api.delete(`/fiscal/apuracoes/${id}`);
}

export async function addAdjustmentApi(
  apurationId: string,
  payload: { type: string; description: string; value: number; documentRef?: string },
): Promise<TaxApurationAdjustment> {
  const { data } = await api.post(`/fiscal/apuracoes/${apurationId}/ajustes`, payload);
  return data;
}

export async function removeAdjustmentApi(apurationId: string, adjustmentId: string): Promise<void> {
  await api.delete(`/fiscal/apuracoes/${apurationId}/ajustes/${adjustmentId}`);
}

export async function upsertSimplesRevenueApi(
  apurationId: string,
  payload: { annex: string; totalRevenue: number; revenueWithSt?: number; revenueMonophasic?: number; revenueIssRetained?: number },
): Promise<TaxApurationSimplesRevenue> {
  const { data } = await api.put(`/fiscal/apuracoes/${apurationId}/receitas-simples`, payload);
  return data;
}

// ── Obrigações acessórias ──────────────────────────────────────────────────

export async function fetchObligations(clientId: string, year?: number): Promise<FiscalObligation[]> {
  const { data } = await api.get('/fiscal/obrigacoes', { params: { clientId, year } });
  return data;
}

export async function createObligationApi(payload: {
  clientId: string; type: string; periodMonth: number; periodYear: number; dueDate?: string; notes?: string;
}): Promise<FiscalObligation> {
  const { data } = await api.post('/fiscal/obrigacoes', payload);
  return data;
}

export async function generateObligationApi(id: string): Promise<{ fileName: string; size: number }> {
  const { data } = await api.post(`/fiscal/obrigacoes/${id}/gerar`);
  return data;
}

export function downloadObligationUrl(id: string): string {
  return `${api.defaults.baseURL}/fiscal/obrigacoes/${id}/download`;
}

export async function markTransmittedApi(id: string): Promise<FiscalObligation> {
  const { data } = await api.post(`/fiscal/obrigacoes/${id}/transmitir`);
  return data;
}

export async function markDispensedApi(id: string, notes?: string): Promise<FiscalObligation> {
  const { data } = await api.post(`/fiscal/obrigacoes/${id}/dispensar`, { notes });
  return data;
}

export async function deleteObligationApi(id: string): Promise<void> {
  await api.delete(`/fiscal/obrigacoes/${id}`);
}

// ── Livros fiscais ─────────────────────────────────────────────────────────

export async function fetchBooks(clientId: string, year?: number): Promise<FiscalBook[]> {
  const { data } = await api.get('/fiscal/livros', { params: { clientId, year } });
  return data;
}

export async function generateBookApi(payload: {
  clientId: string; bookType: string; periodMonth: number; periodYear: number;
}): Promise<FiscalBook> {
  const { data } = await api.post('/fiscal/livros', payload);
  return data;
}

export function downloadBookUrl(id: string): string {
  return `${api.defaults.baseURL}/fiscal/livros/${id}/download`;
}

export async function deleteBookApi(id: string): Promise<void> {
  await api.delete(`/fiscal/livros/${id}`);
}
