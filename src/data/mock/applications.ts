import type { Application } from './types';

export const applications: Application[] = [
  {
    id: 'app-risk-platform',
    name: 'Risk Data Platform',
    description: 'Producer application for risk data: exposure, limits, NPE, VaR. Feeds BCBS 239 reporting.',
    owner: 'Jane Risk',
    type: 'producer',
    connectorIds: ['conn-snowflake-1'],
  },
  {
    id: 'app-customer-master',
    name: 'Customer Master App',
    description: 'Producer for customer and party master data. Publishes to Customer 360 data product.',
    owner: 'Alice Data',
    type: 'producer',
    connectorIds: ['conn-bq-1'],
  },
  {
    id: 'app-finance-ledger',
    name: 'Finance Ledger App',
    description: 'Producer for transaction and ledger data.',
    owner: 'Carol Finance',
    type: 'producer',
  },
  {
    id: 'app-bcbs-consumer',
    name: 'BCBS Consumer App',
    description: 'Consumer application for BCBS 239 reporting. Used as default for voting and comments.',
    owner: 'Jane Risk',
    type: 'consumer',
    consumedDataProductIds: ['dp-exposure', 'dp-customer-attr'],
  },
  {
    id: 'app-reporting-consumer',
    name: 'BCBS Reporting Consumer',
    description: 'Consumer application that consumes exposure and risk data for regulatory reporting.',
    owner: 'Jane Risk',
    type: 'consumer',
    consumedDataProductIds: ['dp-exposure', 'dp-npe', 'dp-var'],
  },
];
