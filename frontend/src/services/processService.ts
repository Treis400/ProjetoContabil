import { api } from './api';
import type { DocumentItem, Process, ProcessPayload } from '../types';

export async function fetchProcesses(params?: Record<string, string>) {
  const { data } = await api.get<Process[]>('/processes', { params });
  return data;
}

export async function fetchProcess(id: string) {
  const { data } = await api.get<Process>(`/processes/${id}`);
  return data;
}

export async function createProcess(payload: ProcessPayload) {
  const { data } = await api.post<Process>('/processes', payload);
  return data;
}

export async function updateProcess(id: string, payload: ProcessPayload) {
  const { data } = await api.put<Process>(`/processes/${id}`, payload);
  return data;
}

export async function updateProcessStatus(id: string, status: string, description: string) {
  const { data } = await api.patch<Process>(`/processes/${id}/status`, { status, description });
  return data;
}

export async function fetchKanban() {
  const { data } = await api.get<Record<string, Process[]>>('/kanban/processes');
  return data;
}

export async function fetchProcessDocuments(id: string) {
  const { data } = await api.get<DocumentItem[]>(`/processes/${id}/documents`);
  return data;
}

export async function uploadProcessDocument(id: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post(`/processes/${id}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
}
