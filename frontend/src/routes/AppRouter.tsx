import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AlertsPage } from '../pages/AlertsPage';
import { ClientDetailPage } from '../pages/ClientDetailPage';
import { ClientFormPage } from '../pages/ClientFormPage';
import { ClientsPage } from '../pages/ClientsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { KanbanPage } from '../pages/KanbanPage';
import { LoginPage } from '../pages/LoginPage';
import { ProcessDetailPage } from '../pages/ProcessDetailPage';
import { ProcessFormPage } from '../pages/ProcessFormPage';
import { ProcessesPage } from '../pages/ProcessesPage';
import { TaxReviewsPage } from '../pages/TaxReviewsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/clientes/novo" element={<ClientFormPage />} />
            <Route path="/clientes/:id" element={<ClientDetailPage />} />
            <Route path="/clientes/:id/editar" element={<ClientFormPage />} />
            <Route path="/processos" element={<ProcessesPage />} />
            <Route path="/processos/novo" element={<ProcessFormPage />} />
            <Route path="/processos/:id" element={<ProcessDetailPage />} />
            <Route path="/processos/:id/editar" element={<ProcessFormPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/documentos" element={<DocumentsPage />} />
            <Route path="/tributario" element={<TaxReviewsPage />} />
            <Route path="/alertas" element={<AlertsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
