import type { Domain } from './types';

export const domains: Domain[] = [
  {
    id: 'dom-risk',
    name: 'Risk',
    description: 'Risk data aggregation and reporting',
    subdomains: [
      {
        id: 'sub-credit-risk',
        name: 'Credit Risk',
        domainId: 'dom-risk',
        dataProducts: [
          {
            id: 'dp-exposure',
            name: 'Exposure Data Product',
            description: 'Credit exposure and limits for BCBS 239 reporting',
            subdomainId: 'sub-credit-risk',
            domainId: 'dom-risk',
            owner: 'Jane Risk',
            ownerEmail: 'jane.risk@company.com',
            sla: 'Daily 06:00 UTC',
            outputPortAssetIds: ['asset-exposure', 'asset-limits'],
            contractId: 'contract-exposure',
            tags: ['BCBS 239', 'credit', 'exposure'],
            certified: true,
          },
          {
            id: 'dp-npe',
            name: 'NPE Data Product',
            description: 'Non-performing exposures',
            subdomainId: 'sub-credit-risk',
            domainId: 'dom-risk',
            owner: 'Jane Risk',
            ownerEmail: 'jane.risk@company.com',
            outputPortAssetIds: ['asset-npe'],
            tags: ['BCBS 239', 'NPE'],
            certified: true,
          },
        ],
      },
      {
        id: 'sub-market-risk',
        name: 'Market Risk',
        domainId: 'dom-risk',
        dataProducts: [
          {
            id: 'dp-var',
            name: 'VaR Data Product',
            description: 'Value at Risk and market risk metrics',
            subdomainId: 'sub-market-risk',
            domainId: 'dom-risk',
            owner: 'Bob Trader',
            ownerEmail: 'bob.trader@company.com',
            outputPortAssetIds: ['asset-var'],
            tags: ['BCBS 239', 'market-risk'],
            certified: true,
          },
        ],
      },
    ],
  },
  {
    id: 'dom-customer',
    name: 'Customer',
    description: 'Customer and party data',
    subdomains: [
      {
        id: 'sub-customer-360',
        name: 'Customer 360',
        domainId: 'dom-customer',
        dataProducts: [
          {
            id: 'dp-customer-attr',
            name: 'Customer Attributes',
            description: 'Master customer attributes for analytics',
            subdomainId: 'sub-customer-360',
            domainId: 'dom-customer',
            owner: 'Alice Data',
            ownerEmail: 'alice.data@company.com',
            sla: 'Hourly',
            outputPortAssetIds: ['asset-customer-attr'],
            contractId: 'contract-customer',
            tags: ['customer', 'master'],
            certified: true,
          },
        ],
      },
    ],
  },
  {
    id: 'dom-finance',
    name: 'Finance',
    description: 'Finance and ledger data',
    subdomains: [
      {
        id: 'sub-ledger',
        name: 'Ledger',
        domainId: 'dom-finance',
        dataProducts: [
          {
            id: 'dp-transactions',
            name: 'Transaction Data Product',
            description: 'Transactional data for finance reporting',
            subdomainId: 'sub-ledger',
            domainId: 'dom-finance',
            owner: 'Carol Finance',
            ownerEmail: 'carol.finance@company.com',
            outputPortAssetIds: ['asset-transactions'],
            tags: ['finance', 'transactions'],
            certified: false,
          },
        ],
      },
    ],
  },
  {
    id: 'dom-operations',
    name: 'Operations',
    description: 'Operations and reference data',
    subdomains: [
      {
        id: 'sub-ref',
        name: 'Reference Data',
        domainId: 'dom-operations',
        dataProducts: [
          {
            id: 'dp-ref',
            name: 'Reference Data Product',
            description: 'Reference and lookup tables',
            subdomainId: 'sub-ref',
            domainId: 'dom-operations',
            owner: 'Dave Ops',
            ownerEmail: 'dave.ops@company.com',
            outputPortAssetIds: ['asset-ref'],
            tags: ['reference'],
            certified: false,
          },
        ],
      },
    ],
  },
];
