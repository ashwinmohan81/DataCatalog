import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { AppShell } from './components/AppShell';
import { HomeRedirect } from './components/HomeRedirect';

import { SearchPage } from './pages/SearchPage';
import { CatalogPage } from './pages/CatalogPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { InventoryPage } from './pages/InventoryPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { MedallionPage } from './pages/MedallionPage';
import { AssetDetailPage } from './pages/AssetDetailPage';
import { DataProductDetailPage } from './pages/DataProductDetailPage';
import { DataProductCreatePage } from './pages/DataProductCreatePage';
import { GlossaryPage } from './pages/GlossaryPage';
import { GlossaryDetailPage } from './pages/GlossaryDetailPage';
import { GlossaryTermPage } from './pages/GlossaryTermPage';
import { GlossaryTermCreatePage } from './pages/GlossaryTermCreatePage';
import { ContractsPage } from './pages/ContractsPage';
import { ContractConsumePage } from './pages/ContractConsumePage';
import { ContractDetailPage } from './pages/ContractDetailPage';
import { ContractRequestPage } from './pages/ContractRequestPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { WorkflowTaskPage } from './pages/WorkflowTaskPage';
import { LineagePage } from './pages/LineagePage';
import { InsightsPage } from './pages/InsightsPage';
import { CompliancePage } from './pages/CompliancePage';
import { ConnectorsPage } from './pages/ConnectorsPage';
import { TagsPage } from './pages/TagsPage';

function App() {
  const persona = useAppStore((s) => s.persona);
  const homePath = persona === 'consumer' ? '/marketplace' : persona === 'steward' ? '/glossary' : persona === 'owner' ? '/workflows' : persona === 'engineer' ? '/catalog' : '/compliance';

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeRedirect homePath={homePath} />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/domain/:domainId" element={<CatalogPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/application/:applicationId" element={<ApplicationDetailPage />} />
        <Route path="/inventory/medallion" element={<MedallionPage />} />
        <Route path="/asset/:assetId" element={<AssetDetailPage />} />
        <Route path="/data-product/new" element={<DataProductCreatePage />} />
        <Route path="/data-product/:dataProductId" element={<DataProductDetailPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/glossary/glossary/:glossaryId" element={<GlossaryDetailPage />} />
        <Route path="/glossary/glossary/:glossaryId/term/new" element={<GlossaryTermCreatePage />} />
        <Route path="/glossary/term/:termId" element={<GlossaryTermPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/contracts/request" element={<ContractRequestPage />} />
        <Route path="/contracts/consume/:contractId" element={<ContractConsumePage />} />
        <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
        <Route path="/quality" element={<DataQualityPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/workflows/task/:taskId" element={<WorkflowTaskPage />} />
        <Route path="/lineage" element={<LineagePage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/connectors" element={<ConnectorsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;
