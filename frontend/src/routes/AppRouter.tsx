import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AlertsPage } from '../pages/AlertsPage';
import { LalurPage } from '../pages/lalur/LalurPage';
import { PatrimonyAssetsPage } from '../pages/patrimony/PatrimonyAssetsPage';
import { PatrimonyAssetFormPage } from '../pages/patrimony/PatrimonyAssetFormPage';
import { PatrimonyAssetDetailPage } from '../pages/patrimony/PatrimonyAssetDetailPage';
import { PatrimonyDeprecPage } from '../pages/patrimony/PatrimonyDeprecPage';
import { PatrimonyInventoryPage } from '../pages/patrimony/PatrimonyInventoryPage';
import { PatrimonyCadastrosPage } from '../pages/patrimony/PatrimonyCadastrosPage';
import { ClientDetailPage } from '../pages/ClientDetailPage';
import { ClientFormPage } from '../pages/ClientFormPage';
import { ClientsPage } from '../pages/ClientsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { FiscalAuxTablesPage } from '../pages/fiscal/FiscalAuxTablesPage';
import { FiscalDocumentDetailPage } from '../pages/fiscal/FiscalDocumentDetailPage';
import { FiscalDocumentFormPage } from '../pages/fiscal/FiscalDocumentFormPage';
import { FiscalDocumentImportPage } from '../pages/fiscal/FiscalDocumentImportPage';
import { FiscalDocumentsPage } from '../pages/fiscal/FiscalDocumentsPage';
import { FiscalProductFormPage } from '../pages/fiscal/FiscalProductFormPage';
import { FiscalProductsPage } from '../pages/fiscal/FiscalProductsPage';
import { FiscalServiceFormPage } from '../pages/fiscal/FiscalServiceFormPage';
import { FiscalServicesPage } from '../pages/fiscal/FiscalServicesPage';
import { TaxApurationPage } from '../pages/fiscal/TaxApurationPage';
import { TaxApurationDetailPage } from '../pages/fiscal/TaxApurationDetailPage';
import { FiscalObligationsPage } from '../pages/fiscal/FiscalObligationsPage';
import { AccountingPlanPage } from '../pages/accounting/AccountingPlanPage';
import { AccountingCadastrosPage } from '../pages/accounting/AccountingCadastrosPage';
import { AccountingParametersPage } from '../pages/accounting/AccountingParametersPage';
import { AccountingEntriesPage } from '../pages/accounting/AccountingEntriesPage';
import { AccountingEntryFormPage } from '../pages/accounting/AccountingEntryFormPage';
import { AccountingEntryDetailPage } from '../pages/accounting/AccountingEntryDetailPage';
import { AccountingLedgerPage } from '../pages/accounting/AccountingLedgerPage';
import { AccountingTrialBalancePage } from '../pages/accounting/AccountingTrialBalancePage';
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
            {/* Módulo Fiscal — Cadastros */}
            <Route path="/fiscal/produtos" element={<FiscalProductsPage />} />
            <Route path="/fiscal/produtos/novo" element={<FiscalProductFormPage />} />
            <Route path="/fiscal/produtos/:id/editar" element={<FiscalProductFormPage />} />
            <Route path="/fiscal/servicos" element={<FiscalServicesPage />} />
            <Route path="/fiscal/servicos/novo" element={<FiscalServiceFormPage />} />
            <Route path="/fiscal/servicos/:id/editar" element={<FiscalServiceFormPage />} />
            <Route path="/fiscal/tabelas" element={<FiscalAuxTablesPage />} />
            {/* Módulo Contábil */}
            <Route path="/contabil/plano-contas"       element={<AccountingPlanPage />} />
            <Route path="/contabil/cadastros"          element={<AccountingCadastrosPage />} />
            <Route path="/contabil/parametros"         element={<AccountingParametersPage />} />
            <Route path="/contabil/lancamentos"        element={<AccountingEntriesPage />} />
            <Route path="/contabil/lancamentos/novo"   element={<AccountingEntryFormPage />} />
            <Route path="/contabil/lancamentos/:id"    element={<AccountingEntryDetailPage />} />
            <Route path="/contabil/razao"              element={<AccountingLedgerPage />} />
            <Route path="/contabil/balancete"          element={<AccountingTrialBalancePage />} />
            {/* Módulo Fiscal — Apuração */}
            <Route path="/fiscal/apuracoes" element={<TaxApurationPage />} />
            <Route path="/fiscal/apuracoes/:id" element={<TaxApurationDetailPage />} />
            {/* Módulo Fiscal — Obrigações e Livros */}
            <Route path="/fiscal/obrigacoes" element={<FiscalObligationsPage />} />
            {/* Módulo Fiscal — Escrituração */}
            <Route path="/fiscal/documentos" element={<FiscalDocumentsPage />} />
            <Route path="/fiscal/documentos/novo" element={<FiscalDocumentFormPage />} />
            <Route path="/fiscal/documentos/importar" element={<FiscalDocumentImportPage />} />
            <Route path="/fiscal/documentos/:id" element={<FiscalDocumentDetailPage />} />
            {/* LALUR */}
            <Route path="/lalur" element={<LalurPage />} />
            {/* Patrimônio */}
            <Route path="/patrimonio/bens" element={<PatrimonyAssetsPage />} />
            <Route path="/patrimonio/bens/novo" element={<PatrimonyAssetFormPage />} />
            <Route path="/patrimonio/bens/:id" element={<PatrimonyAssetDetailPage />} />
            <Route path="/patrimonio/bens/:id/editar" element={<PatrimonyAssetFormPage />} />
            <Route path="/patrimonio/depreciacao" element={<PatrimonyDeprecPage />} />
            <Route path="/patrimonio/inventario" element={<PatrimonyInventoryPage />} />
            <Route path="/patrimonio/cadastros" element={<PatrimonyCadastrosPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
