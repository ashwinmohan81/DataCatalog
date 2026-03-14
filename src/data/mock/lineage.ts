import type { LineageGraph } from './types';

export const lineageGraphs: LineageGraph[] = [
  {
    assetId: 'asset-exposure',
    columnId: 'col-e3',
    nodes: [
      { id: 'node-src', name: 'Source System - Core Banking', type: 'source', system: 'Core Banking' },
      { id: 'node-staging', name: 'Risk Staging', type: 'transform', system: 'Snowflake' },
      { id: 'node-dwh', name: 'credit_exposure_fact', type: 'destination', system: 'Snowflake', assetId: 'asset-exposure' },
      { id: 'node-report', name: 'BCBS Exposure Report', type: 'destination', system: 'Reporting' },
    ],
    edges: [
      { from: 'node-src', to: 'node-staging', columnName: 'exposure_amount' },
      { from: 'node-staging', to: 'node-dwh', columnName: 'exposure_amount' },
      { from: 'node-dwh', to: 'node-report', columnName: 'exposure_amount' },
    ],
  },
  {
    assetId: 'asset-customer-attr',
    columnId: 'col-c1',
    nodes: [
      { id: 'node-crm', name: 'CRM System', type: 'source', system: 'Salesforce' },
      { id: 'node-ingest', name: 'Customer Ingest', type: 'transform', system: 'BigQuery' },
      { id: 'node-master', name: 'customer_attributes', type: 'destination', system: 'BigQuery', assetId: 'asset-customer-attr' },
      { id: 'node-txn', name: 'transaction_fact', type: 'destination', system: 'BigQuery', assetId: 'asset-transactions' },
    ],
    edges: [
      { from: 'node-crm', to: 'node-ingest', columnName: 'customer_id' },
      { from: 'node-ingest', to: 'node-master', columnName: 'customer_id' },
      { from: 'node-master', to: 'node-txn', columnName: 'customer_id' },
    ],
  },
  {
    assetId: 'asset-exposure',
    columnId: 'col-e2',
    nodes: [
      { id: 'node-party', name: 'Party Master', type: 'source', system: 'MDM' },
      { id: 'node-risk', name: 'credit_exposure_fact', type: 'destination', system: 'Snowflake', assetId: 'asset-exposure' },
    ],
    edges: [
      { from: 'node-party', to: 'node-risk', columnName: 'counterparty_id' },
    ],
  },
];
