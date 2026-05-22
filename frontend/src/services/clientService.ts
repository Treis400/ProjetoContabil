import { api } from './api';
import type { Client, ClientPayload, DocumentItem } from '../types';

export async function fetchClients(params?: Record<string, string>) {
  const { data } = await api.get<Client[]>('/clients', { params });
  return data;
}

export async function fetchClient(id: string) {
  const { data } = await api.get<Client>(`/clients/${id}`);
  return data;
}

export async function createClient(payload: ClientPayload) {
  const { data } = await api.post<Client>('/clients', payload);
  return data;
}

export async function updateClient(id: string, payload: ClientPayload) {
  const { data } = await api.put<Client>(`/clients/${id}`, payload);
  return data;
}

export async function deleteClient(id: string) {
  await api.delete(`/clients/${id}`);
}

export async function fetchClientDocuments(id: string) {
  const { data } = await api.get<DocumentItem[]>(`/clients/${id}/documents`);
  return data;
}

export async function uploadClientDocument(id: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post(`/clients/${id}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
}
