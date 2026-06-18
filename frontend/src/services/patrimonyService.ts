import { api } from './api';

const base = (clientId: string) => ({ params: { clientId } });

// Grupos
export const listGroups = (clientId: string) => api.get('/patrimonio/grupos', base(clientId)).then((r: any) => r.data);
export const createGroup = (clientId: string, data: any) => api.post('/patrimonio/grupos', data, base(clientId)).then((r: any) => r.data);
export const updateGroup = (id: string, clientId: string, data: any) => api.put(`/patrimonio/grupos/${id}`, data, base(clientId)).then((r: any) => r.data);
export const deleteGroup = (id: string, clientId: string) => api.delete(`/patrimonio/grupos/${id}`, base(clientId));

// Localizações
export const listLocations = (clientId: string) => api.get('/patrimonio/localizacoes', base(clientId)).then((r: any) => r.data);
export const createLocation = (clientId: string, data: any) => api.post('/patrimonio/localizacoes', data, base(clientId)).then((r: any) => r.data);
export const updateLocation = (id: string, clientId: string, data: any) => api.put(`/patrimonio/localizacoes/${id}`, data, base(clientId)).then((r: any) => r.data);
export const deleteLocation = (id: string, clientId: string) => api.delete(`/patrimonio/localizacoes/${id}`, base(clientId));

// Responsáveis
export const listResponsibles = (clientId: string) => api.get('/patrimonio/responsaveis', base(clientId)).then((r: any) => r.data);
export const createResponsible = (clientId: string, data: any) => api.post('/patrimonio/responsaveis', data, base(clientId)).then((r: any) => r.data);
export const updateResponsible = (id: string, clientId: string, data: any) => api.put(`/patrimonio/responsaveis/${id}`, data, base(clientId)).then((r: any) => r.data);
export const deleteResponsible = (id: string, clientId: string) => api.delete(`/patrimonio/responsaveis/${id}`, base(clientId));

// Bens
export const listAssets = (clientId: string, filters?: any) => api.get('/patrimonio/bens', { params: { clientId, ...filters } }).then((r: any) => r.data);
export const getAsset = (id: string) => api.get(`/patrimonio/bens/${id}`).then((r: any) => r.data);
export const createAsset = (clientId: string, data: any) => api.post('/patrimonio/bens', data, base(clientId)).then((r: any) => r.data);
export const updateAsset = (id: string, clientId: string, data: any) => api.put(`/patrimonio/bens/${id}`, data, base(clientId)).then((r: any) => r.data);

// Movimentação
export const createMovement = (assetId: string, clientId: string, data: any) =>
  api.post(`/patrimonio/bens/${assetId}/movimentacoes`, data, base(clientId)).then((r: any) => r.data);

// Depreciação
export const calcDepreciation = (clientId: string, periodMonth: number, periodYear: number) =>
  api.post('/patrimonio/depreciacao/calcular', { periodMonth, periodYear }, base(clientId)).then((r: any) => r.data);
export const getDepreciationSummary = (clientId: string, periodMonth: number, periodYear: number) =>
  api.get('/patrimonio/depreciacao/resumo', { params: { clientId, periodMonth, periodYear } }).then((r: any) => r.data);

// Reavaliação
export const createRevaluation = (assetId: string, clientId: string, data: any) =>
  api.post(`/patrimonio/bens/${assetId}/reavaliacao`, data, base(clientId)).then((r: any) => r.data);

// Baixa
export const createDisposal = (assetId: string, clientId: string, data: any) =>
  api.post(`/patrimonio/bens/${assetId}/baixa`, data, base(clientId)).then((r: any) => r.data);

// Inventário
export const listInventories = (clientId: string) => api.get('/patrimonio/inventarios', base(clientId)).then((r: any) => r.data);
export const createInventory = (clientId: string, data: any) => api.post('/patrimonio/inventarios', data, base(clientId)).then((r: any) => r.data);
export const getInventory = (id: string) => api.get(`/patrimonio/inventarios/${id}`).then((r: any) => r.data);
export const closeInventory = (id: string, clientId: string) => api.post(`/patrimonio/inventarios/${id}/fechar`, {}, base(clientId)).then((r: any) => r.data);
export const updateInventoryItem = (inventoryId: string, itemId: string, clientId: string, data: any) =>
  api.put(`/patrimonio/inventarios/${inventoryId}/itens/${itemId}`, data, base(clientId)).then((r: any) => r.data);

// Encerramento
export const listPeriodClosings = (clientId: string) => api.get('/patrimonio/encerramento', base(clientId)).then((r: any) => r.data);
export const closePeriod = (clientId: string, periodMonth: number, periodYear: number) =>
  api.post('/patrimonio/encerramento/fechar', { periodMonth, periodYear }, base(clientId)).then((r: any) => r.data);
export const reopenPeriod = (clientId: string, periodMonth: number, periodYear: number, reason: string) =>
  api.post('/patrimonio/encerramento/reabrir', { periodMonth, periodYear, reason }, base(clientId)).then((r: any) => r.data);
