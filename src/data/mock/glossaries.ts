import type { Glossary } from './types';

export const glossaries: Glossary[] = [
  {
    id: 'glossary-enterprise',
    name: 'Enterprise Glossary',
    description: 'Cross-domain business terms used for governance and reporting.',
    owner: 'Data Governance',
    steward: 'Data Governance',
    linkedGlossaryIds: [],
  },
  {
    id: 'glossary-risk',
    name: 'Risk Glossary',
    description: 'Risk domain terms for BCBS 239 and credit/market risk.',
    owner: 'Jane Risk',
    steward: 'Jane Risk',
    linkedGlossaryIds: ['glossary-enterprise'],
  },
  {
    id: 'glossary-customer',
    name: 'Customer Glossary',
    description: 'Customer and party master terms.',
    owner: 'Alice Data',
    steward: 'Alice Data',
    linkedGlossaryIds: ['glossary-enterprise'],
  },
];
