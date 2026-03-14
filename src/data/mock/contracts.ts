import type { DataContract } from './types';

export const dataContracts: DataContract[] = [
  {
    id: 'contract-exposure',
    name: 'Credit Exposure Data Contract',
    assetId: 'asset-exposure',
    version: 2,
    createdAt: '2025-03-01T10:00:00Z',
    createdBy: 'Jane Risk',
    status: 'approved',
    approvedByApplicationId: 'app-risk-platform',
    approvedAt: '2025-03-02T14:00:00Z',
    slo: 'Daily 06:00 UTC',
    slas: [
      { type: 'freshness', target: 'Daily 06:00 UTC', unit: 'schedule' },
      { type: 'availability', target: '99.9%', unit: 'uptime' },
      { type: 'latency', target: '< 2 min', unit: 'end-to-end' },
    ],
    dqRuleIds: ['rule-1', 'rule-2', 'rule-4'],
    schema: [
      { id: 'attr-e1', name: 'exposure_id', type: 'VARCHAR', description: 'Unique exposure identifier', required: true, glossaryTermId: 'term-exposure-id' },
      { id: 'attr-e2', name: 'counterparty_id', type: 'VARCHAR', required: true, glossaryTermId: 'term-counterparty-id' },
      { id: 'attr-e3', name: 'exposure_amount', type: 'DECIMAL(18,2)', description: 'EAD in reporting currency', required: true, glossaryTermId: 'term-exposure-amount' },
      { id: 'attr-e4', name: 'as_of_date', type: 'DATE', required: true, glossaryTermId: 'term-as-of-date' },
    ],
    versionHistory: [
      { version: 1, at: '2025-02-15T09:00:00Z', by: 'Jane Risk', changeSummary: 'Initial contract', schema: [], slas: [], dqRuleIds: [] },
      { version: 2, at: '2025-03-01T10:00:00Z', by: 'Jane Risk', changeSummary: 'Added availability SLA; linked DQ rules exposure_amount not null, exposure_id unique, custom positive check' },
    ],
  },
  {
    id: 'contract-customer',
    name: 'Customer Attributes Data Contract',
    assetId: 'asset-customer-attr',
    version: 1,
    createdAt: '2025-02-01T09:00:00Z',
    createdBy: 'Alice Data',
    status: 'approved',
    approvedByApplicationId: 'app-customer-master',
    approvedAt: '2025-02-05T11:00:00Z',
    slo: 'Hourly',
    slas: [
      { type: 'freshness', target: 'Hourly', unit: 'schedule' },
      { type: 'availability', target: '99.5%', unit: 'uptime' },
    ],
    dqRuleIds: ['rule-3'],
    schema: [
      { id: 'attr-c1', name: 'customer_id', type: 'VARCHAR', required: true, glossaryTermId: 'term-customer-id' },
      { id: 'attr-c2', name: 'customer_name', type: 'VARCHAR', required: false, glossaryTermId: 'term-customer-name' },
      { id: 'attr-c3', name: 'segment', type: 'VARCHAR', required: true },
      { id: 'attr-c4', name: 'region', type: 'VARCHAR', required: false },
    ],
    versionHistory: [
      { version: 1, at: '2025-02-01T09:00:00Z', by: 'Alice Data', changeSummary: 'Initial contract' },
    ],
  },
  {
    id: 'contract-transactions-pending',
    name: 'Transaction Summary Contract (pending)',
    assetId: 'asset-transactions',
    version: 1,
    createdAt: '2025-03-12T16:00:00Z',
    createdBy: 'BCBS Reporting Team',
    status: 'pending_approval',
    requestedByApplicationId: 'app-bcbs-consumer',
    slas: [
      { type: 'freshness', target: 'T+1 08:00 UTC', unit: 'schedule' },
      { type: 'availability', target: '99.9%', unit: 'uptime' },
    ],
    dqRuleIds: ['rule-5'],
    schema: [
      { id: 'attr-t1', name: 'transaction_id', type: 'VARCHAR', required: true },
      { id: 'attr-t2', name: 'account_id', type: 'VARCHAR', required: true },
      { id: 'attr-t3', name: 'amount', type: 'DECIMAL(18,2)', required: true },
      { id: 'attr-t4', name: 'transaction_date', type: 'DATE', required: true },
    ],
    versionHistory: [
      { version: 1, at: '2025-03-12T16:00:00Z', by: 'BCBS Reporting Team', changeSummary: 'Consumer requested contract for reporting' },
    ],
  },
];
