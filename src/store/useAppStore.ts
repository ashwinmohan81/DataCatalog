import { create } from 'zustand';
import type { PersonaId, DataContract, DataProduct, GlossaryTerm, DQRule } from '../data/mock/types';
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
  addCustomTag: (name: string, categoryId?: string | null) => void;
  removeCustomTag: (name: string) => void;
  /** Tag categories for grouping tags. */
  tagCategories: Array<{ id: string; name: string }>;
  tagCategoryByTagName: Record<string, string>;
  addTagCategory: (name: string) => void;
  removeTagCategory: (id: string) => void;
  updateTagCategory: (id: string, name: string) => void;
  setTagCategoryForTag: (tagName: string, categoryId: string | null) => void;
  /** Column tag overrides: key = assetId:columnId, value = full tag list for that column. */
  columnTagOverrides: Record<string, string[]>;
  setColumnTags: (assetId: string, columnId: string, tags: string[]) => void;
  /** Runtime-added DQ rules (prebuilt enabled or custom SQL). */
  runtimeDqRules: DQRule[];
  addDqRule: (r: DQRule) => void;
  removeDqRule: (id: string) => void;
  /** Current application (consumer or producer) for voting/commenting. Default demo consumer when persona is consumer. */
  currentApplicationId: string | null;
  setCurrentApplicationId: (id: string | null) => void;
  /** Data product votes: [dataProductId][applicationId] = 1 | -1 | 0 */
  dataProductVotes: Record<string, Record<string, number>>;
  setVote: (dataProductId: string, applicationId: string, value: 1 | -1 | 0) => void;
  /** Data product comments (one per consumer per product). */
  dataProductComments: Array<{
    id: string;
    dataProductId: string;
    applicationId: string;
    text: string;
    createdAt: string;
    updatedAt?: string;
    producerResponse?: string;
    producerResponseAt?: string;
  }>;
  addOrUpdateComment: (dataProductId: string, applicationId: string, text: string) => void;
  deleteComment: (dataProductId: string, applicationId: string) => void;
  setProducerResponse: (commentId: string, response: string) => void;
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
  addCustomTag: (name, categoryId) =>
    set((s) => {
      const n = name.trim();
      if (!n || s.customTags.includes(n)) return s;
      const nextTags = [...s.customTags, n].sort();
      const nextByTag = { ...s.tagCategoryByTagName };
      if (categoryId) nextByTag[n] = categoryId;
      return { customTags: nextTags, tagCategoryByTagName: nextByTag };
    }),
  removeCustomTag: (name) =>
    set((s) => {
      const nextByTag = { ...s.tagCategoryByTagName };
      delete nextByTag[name];
      return { customTags: s.customTags.filter((t) => t !== name), tagCategoryByTagName: nextByTag };
    }),
  tagCategories: [],
  tagCategoryByTagName: {},
  addTagCategory: (name) =>
    set((s) => {
      const n = name.trim();
      if (!n || s.tagCategories.some((c) => c.name === n)) return s;
      const id = `tag-cat-${Date.now()}`;
      return { tagCategories: [...s.tagCategories, { id, name: n }].sort((a, b) => a.name.localeCompare(b.name)) };
    }),
  removeTagCategory: (id) =>
    set((s) => {
      const nextByTag = { ...s.tagCategoryByTagName };
      Object.keys(nextByTag).forEach((tag) => { if (nextByTag[tag] === id) delete nextByTag[tag]; });
      return { tagCategories: s.tagCategories.filter((c) => c.id !== id), tagCategoryByTagName: nextByTag };
    }),
  updateTagCategory: (id, name) =>
    set((s) => {
      const n = name.trim();
      if (!n) return s;
      return {
        tagCategories: s.tagCategories.map((c) => (c.id === id ? { ...c, name: n } : c)).sort((a, b) => a.name.localeCompare(b.name)),
      };
    }),
  setTagCategoryForTag: (tagName, categoryId) =>
    set((s) => {
      const next = { ...s.tagCategoryByTagName };
      if (categoryId == null) delete next[tagName];
      else next[tagName] = categoryId;
      return { tagCategoryByTagName: next };
    }),
  columnTagOverrides: {},
  setColumnTags: (assetId, columnId, tags) =>
    set((s) => {
      const key = `${assetId}:${columnId}`;
      const next = { ...s.columnTagOverrides };
      if (tags.length === 0) delete next[key];
      else next[key] = tags;
      return { columnTagOverrides: next };
    }),
  runtimeDqRules: [],
  addDqRule: (r) => set((s) => ({ runtimeDqRules: [...s.runtimeDqRules, r] })),
  removeDqRule: (id) => set((s) => ({ runtimeDqRules: s.runtimeDqRules.filter((r) => r.id !== id) })),
  currentApplicationId: 'app-bcbs-consumer',
  setCurrentApplicationId: (id) => set({ currentApplicationId: id }),
  dataProductVotes: {},
  setVote: (dataProductId, applicationId, value) =>
    set((s) => {
      const next = { ...s.dataProductVotes };
      if (!next[dataProductId]) next[dataProductId] = {};
      const inner = { ...next[dataProductId] };
      if (value === 0) delete inner[applicationId];
      else inner[applicationId] = value;
      if (Object.keys(inner).length === 0) delete next[dataProductId];
      else next[dataProductId] = inner;
      return { dataProductVotes: next };
    }),
  dataProductComments: [],
  addOrUpdateComment: (dataProductId, applicationId, text) =>
    set((s) => {
      const id = `${dataProductId}:${applicationId}`;
      const now = new Date().toISOString();
      const existing = s.dataProductComments.find((c) => c.dataProductId === dataProductId && c.applicationId === applicationId);
      if (existing) {
        return {
          dataProductComments: s.dataProductComments.map((c) =>
            c.id === existing.id ? { ...c, text, updatedAt: now } : c
          ),
        };
      }
      return {
        dataProductComments: [...s.dataProductComments, { id, dataProductId, applicationId, text, createdAt: now }],
      };
    }),
  deleteComment: (dataProductId, applicationId) =>
    set((s) => ({
      dataProductComments: s.dataProductComments.filter(
        (c) => !(c.dataProductId === dataProductId && c.applicationId === applicationId)
      ),
    })),
  setProducerResponse: (commentId, response) =>
    set((s) => {
      const now = new Date().toISOString();
      return {
        dataProductComments: s.dataProductComments.map((c) =>
          c.id === commentId ? { ...c, producerResponse: response || undefined, producerResponseAt: response ? now : undefined } : c
        ),
      };
    }),
}));
