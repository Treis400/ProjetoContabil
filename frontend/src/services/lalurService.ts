import { api } from './api';

const base = (clientId: string) => ({ params: { clientId } });

// Tipos de ajuste
export const listAdjustTypes = (clientId: string) => api.get('/lalur/tipos-ajuste', base(clientId)).then((r: any) => r.data);
export const createAdjustType = (clientId: string, data: any) => api.post('/lalur/tipos-ajuste', data, base(clientId)).then((r: any) => r.data);
export const updateAdjustType = (id: string, clientId: string, data: any) => api.put(`/lalur/tipos-ajuste/${id}`, data, base(clientId)).then((r: any) => r.data);
export const deleteAdjustType = (id: string, clientId: string) => api.delete(`/lalur/tipos-ajuste/${id}`, base(clientId));

// Regras de integração contábil
export const listAccountingRules = (clientId: string) => api.get('/lalur/regras-contabil', base(clientId)).then((r: any) => r.data);
export const createAccountingRule = (clientId: string, data: any) => api.post('/lalur/regras-contabil', data, base(clientId)).then((r: any) => r.data);
export const updateAccountingRule = (id: string, clientId: string, data: any) => api.put(`/lalur/regras-contabil/${id}`, data, base(clientId)).then((r: any) => r.data);
export const deleteAccountingRule = (id: string, clientId: string) => api.delete(`/lalur/regras-contabil/${id}`, base(clientId));

// Períodos
export const listPeriods = (clientId: string) => api.get('/lalur/periodos', base(clientId)).then((r: any) => r.data);
export const getPeriod = (clientId: string, year: number) => api.get(`/lalur/periodos/${year}`, base(clientId)).then((r: any) => r.data);
export const upsertPeriod = (clientId: string, year: number, data: any) => api.put(`/lalur/periodos/${year}`, data, base(clientId)).then((r: any) => r.data);
export const lockPeriod = (clientId: string, year: number) => api.post(`/lalur/periodos/${year}/encerrar`, {}, base(clientId)).then((r: any) => r.data);
export const unlockPeriod = (clientId: string, year: number) => api.post(`/lalur/periodos/${year}/reabrir`, {}, base(clientId)).then((r: any) => r.data);
export const importAccountingResult = (clientId: string, year: number) => api.post(`/lalur/periodos/${year}/importar-contabilidade`, {}, base(clientId)).then((r: any) => r.data);
export const listAccountingImports = (periodId: string, clientId: string) => api.get(`/lalur/periodos/${periodId}/importacoes`, base(clientId)).then((r: any) => r.data);

// Parte A
export const listPartA = (periodId: string, clientId: string) => api.get(`/lalur/periodos/${periodId}/parte-a`, base(clientId)).then((r: any) => r.data);
export const createPartA = (periodId: string, clientId: string, data: any) => api.post(`/lalur/periodos/${periodId}/parte-a`, data, base(clientId)).then((r: any) => r.data);
export const updatePartA = (id: string, clientId: string, data: any) => api.put(`/lalur/parte-a/${id}`, data, base(clientId)).then((r: any) => r.data);
export const deletePartA = (id: string, clientId: string) => api.delete(`/lalur/parte-a/${id}`, base(clientId));

// Parte B
export const listPartB = (periodId: string, clientId: string) => api.get(`/lalur/periodos/${periodId}/parte-b`, base(clientId)).then((r: any) => r.data);
export const createPartB = (periodId: string, clientId: string, data: any) => api.post(`/lalur/periodos/${periodId}/parte-b`, data, base(clientId)).then((r: any) => r.data);
export const updatePartB = (id: string, clientId: string, data: any) => api.put(`/lalur/parte-b/${id}`, data, base(clientId)).then((r: any) => r.data);
export const deletePartB = (id: string, clientId: string) => api.delete(`/lalur/parte-b/${id}`, base(clientId));
export const listPartBMovements = (balanceId: string, clientId: string) => api.get(`/lalur/parte-b/${balanceId}/movimentos`, base(clientId)).then((r: any) => r.data);
export const createPartBMovement = (balanceId: string, clientId: string, data: any) => api.post(`/lalur/parte-b/${balanceId}/movimentos`, data, base(clientId)).then((r: any) => r.data);

// Compensações
export const listCompensations = (clientId: string, type?: string) => api.get('/lalur/compensacoes', { params: { clientId, type } }).then((r: any) => r.data);
export const createCompensation = (periodId: string, clientId: string, data: any) => api.post(`/lalur/periodos/${periodId}/compensacoes`, data, base(clientId)).then((r: any) => r.data);
export const calcCompensationLimit = (clientId: string, year: number) => api.get(`/lalur/periodos/${year}/limite-compensacao`, base(clientId)).then((r: any) => r.data);
export const applyCompensation = (clientId: string, year: number, data: any) => api.post(`/lalur/periodos/${year}/aplicar-compensacao`, data, base(clientId)).then((r: any) => r.data);

// IRPJ/CSLL
export const calcIrpjCsll = (periodId: string, clientId: string, data: any) =>
  api.post(`/lalur/periodos/${periodId}/irpj-csll`, data, base(clientId)).then((r: any) => r.data);

// ECF
export const listEcf = (clientId: string) => api.get('/lalur/ecf', base(clientId)).then((r: any) => r.data);
export const generateEcf = (year: number, clientId: string) => api.post(`/lalur/ecf/${year}/gerar`, {}, base(clientId)).then((r: any) => r.data);
export const downloadEcfUrl = (year: number, clientId: string) => `/api/lalur/ecf/${year}/download?clientId=${clientId}`;

// Auditoria
export const listAuditLogs = (clientId: string, periodId?: string) =>
  api.get('/lalur/auditoria', { params: { clientId, periodId } }).then((r: any) => r.data);
