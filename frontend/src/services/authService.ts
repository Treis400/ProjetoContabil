import { api } from './api';
import type { AuthUser } from '../types';

export async function fetchMe() {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
}

export async function fetchUsers() {
  const { data } = await api.get<Array<AuthUser>>('/users');
  return data;
}
