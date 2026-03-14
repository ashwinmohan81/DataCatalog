import { create } from 'zustand';
import type { PersonaId, DataContract, DataProduct, GlossaryTerm } from '../data/mock/types';
import { notifications } from '../data/mock/notifications';

type Notification = typeof notifications[number];

interface AppState {
  persona: PersonaId;
  setPersona: (p: PersonaId) => void;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  /** Runtime-added contract requests (consumer-created, pending or approved/rejected). */
  contractRequests: DataContract[];
  addContractRequest: (c: DataContract) => void;
  setContractStatus: (
    id: string,
    status: DataContract['status'],
    opts?: { approvedByApplicationId?: string; approvedAt?: string; rejectedReason?: string }
  ) => void;
  /** Runtime-created data products. */
  dataProducts: DataProduct[];
  addDataProduct: (p: DataProduct) => void;
  updateDataProduct: (id: string, patch: Partial<DataProduct>) => void;
  /** Asset ID -> data product ID (for assets in runtime-created products). */
  assetDataProductOverrides: Record<string, string>;
  setAssetDataProductOverride: (assetId: string, dataProductId: string | null) => void;
  /** Runtime-created glossary terms. */
  glossaryTerms: GlossaryTerm[];
  addGlossaryTerm: (t: GlossaryTerm) => void;
  updateGlossaryTerm: (id: string, patch: Partial<GlossaryTerm>) => void;
  /** Column-to-term links (assetId, columnId, termId). Enables linking any column to any term. */
  columnTermLinks: Array<{ assetId: string; columnId: string; termId: string }>;
  addColumnTermLink: (assetId: string, columnId: string, termId: string) => void;
  removeColumnTermLink: (assetId: string, columnId: string, termId: string) => void;
  /** Custom tags (data owner–managed). Use in Tag management and to tag attributes. */
  customTags: string[];
  addCustomTag: (name: string) => void;
  removeCustomTag: (name: string) => void;
  /** Column tag overrides: key = assetId:columnId, value = full tag list for that column. */
  columnTagOverrides: Record<string, string[]>;
  setColumnTags: (assetId: string, columnId: string, tags: string[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  persona: 'consumer',
  setPersona: (persona) => set({ persona }),
  notifications,
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  contractRequests: [],
  addContractRequest: (c) =>
    set((s) => ({ contractRequests: [...s.contractRequests, c] })),
  setContractStatus: (id, status, opts) =>
    set((s) => ({
      contractRequests: s.contractRequests.map((c) =>
        c.id === id ? { ...c, status, ...opts } : c
      ),
    })),
  dataProducts: [],
  addDataProduct: (p) =>
    set((s) => {
      const nextOverrides = { ...s.assetDataProductOverrides };
      p.outputPortAssetIds.forEach((aid) => { nextOverrides[aid] = p.id; });
      return { dataProducts: [...s.dataProducts, p], assetDataProductOverrides: nextOverrides };
    }),
  updateDataProduct: (id, patch) =>
    set((s) => {
      const product = s.dataProducts.find((p) => p.id === id);
      const nextOverrides = { ...s.assetDataProductOverrides };
      if (product && patch.outputPortAssetIds !== undefined) {
        product.outputPortAssetIds.forEach((aid) => { if (nextOverrides[aid] === id) delete nextOverrides[aid]; });
        patch.outputPortAssetIds.forEach((aid) => { nextOverrides[aid] = id; });
      }
      return {
        dataProducts: s.dataProducts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        assetDataProductOverrides: nextOverrides,
      };
    }),
  assetDataProductOverrides: {},
  setAssetDataProductOverride: (assetId, dataProductId) =>
    set((s) => ({
      assetDataProductOverrides: dataProductId == null
        ? (() => { const o = { ...s.assetDataProductOverrides }; delete o[assetId]; return o; })()
        : { ...s.assetDataProductOverrides, [assetId]: dataProductId },
    })),
  glossaryTerms: [],
  addGlossaryTerm: (t) => set((s) => ({ glossaryTerms: [...s.glossaryTerms, t] })),
  updateGlossaryTerm: (id, patch) =>
    set((s) => ({
      glossaryTerms: s.glossaryTerms.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
  columnTermLinks: [],
  addColumnTermLink: (assetId, columnId, termId) =>
    set((s) => {
      if (s.columnTermLinks.some((l) => l.assetId === assetId && l.columnId === columnId && l.termId === termId)) return s;
      return { columnTermLinks: [...s.columnTermLinks, { assetId, columnId, termId }] };
    }),
  removeColumnTermLink: (assetId, columnId, termId) =>
    set((s) => ({
      columnTermLinks: s.columnTermLinks.filter(
        (l) => !(l.assetId === assetId && l.columnId === columnId && l.termId === termId)
      ),
    })),
  customTags: [],
  addCustomTag: (name) =>
    set((s) => {
      const n = name.trim();
      if (!n || s.customTags.includes(n)) return s;
      return { customTags: [...s.customTags, n].sort() };
    }),
  removeCustomTag: (name) =>
    set((s) => ({ customTags: s.customTags.filter((t) => t !== name) })),
  columnTagOverrides: {},
  setColumnTags: (assetId, columnId, tags) =>
    set((s) => {
      const key = `${assetId}:${columnId}`;
      const next = { ...s.columnTagOverrides };
      if (tags.length === 0) delete next[key];
      else next[key] = tags;
      return { columnTagOverrides: next };
    }),
}));
