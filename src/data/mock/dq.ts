import type { DQRule, DQRun } from './types';

export const dqRules: DQRule[] = [
  {
    id: 'rule-1',
    name: 'exposure_amount not null',
    type: 'null_check',
    assetId: 'asset-exposure',
    columnId: 'col-e3',
    config: { column: 'exposure_amount' },
    lastRunAt: '2025-03-14T05:30:00Z',
    lastRunPassed: false,
  },
  {
    id: 'rule-2',
    name: 'exposure_id unique',
    type: 'uniqueness',
    assetId: 'asset-exposure',
    columnId: 'col-e1',
    config: { column: 'exposure_id' },
    lastRunAt: '2025-03-14T05:30:00Z',
    lastRunPassed: true,
  },
  {
    id: 'rule-3',
    name: 'customer_id not null',
    type: 'null_check',
    assetId: 'asset-customer-attr',
    columnId: 'col-c1',
    config: { column: 'customer_id' },
    lastRunAt: '2025-03-14T04:30:00Z',
    lastRunPassed: true,
  },
  {
    id: 'rule-4',
    name: 'Custom: exposure amount positive',
    type: 'custom_sql',
    assetId: 'asset-exposure',
    columnId: 'col-e3',
    sql: 'SELECT exposure_id FROM credit_exposure_fact WHERE exposure_amount < 0',
    lastRunAt: '2025-03-14T05:30:00Z',
    lastRunPassed: true,
  },
  {
    id: 'rule-5',
    name: 'transaction amount range',
    type: 'range',
    assetId: 'asset-transactions',
    columnId: 'col-t3',
    config: { column: 'amount', min: 0, max: 999999999.99 },
    lastRunAt: '2025-03-12T03:30:00Z',
    lastRunPassed: false,
  },
];

export const dqRuns: DQRun[] = [
  { id: 'run-1', ruleId: 'rule-1', assetId: 'asset-exposure', runAt: '2025-03-14T05:30:00Z', passed: false, failedCount: 12, sampleFailures: ['EXP000012', 'EXP000045', 'EXP000102'] },
  { id: 'run-2', ruleId: 'rule-2', assetId: 'asset-exposure', runAt: '2025-03-14T05:30:00Z', passed: true },
  { id: 'run-3', ruleId: 'rule-3', assetId: 'asset-customer-attr', runAt: '2025-03-14T04:30:00Z', passed: true },
  { id: 'run-4', ruleId: 'rule-4', assetId: 'asset-exposure', runAt: '2025-03-14T05:30:00Z', passed: true },
  { id: 'run-5', ruleId: 'rule-5', assetId: 'asset-transactions', runAt: '2025-03-12T03:30:00Z', passed: false, failedCount: 200, sampleFailures: ['TXN501', 'TXN502'] },
];
