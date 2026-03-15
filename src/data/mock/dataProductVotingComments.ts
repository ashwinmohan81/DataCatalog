/** Sample votes and comments for data products (Instrument, Party and Account, Transaction domains) for demo. */

export const initialDataProductVotes: Record<string, Record<string, number>> = {
  'dp-exposure': { 'app-bcbs-consumer': 1, 'app-reporting-consumer': 1 },
  'dp-customer-attr': { 'app-bcbs-consumer': 1 },
  'dp-npe': { 'app-reporting-consumer': -1 },
  'dp-var': { 'app-reporting-consumer': 1 },
  'dp-instrument-master': { 'app-bcbs-consumer': 1, 'app-reporting-consumer': 1 },
  'dp-party-accounts': { 'app-bcbs-consumer': 1, 'app-reporting-consumer': -1 },
  'dp-transaction-holdings': { 'app-bcbs-consumer': 1, 'app-reporting-consumer': 1 },
};

export const initialDataProductComments: Array<{
  id: string;
  dataProductId: string;
  applicationId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  producerResponse?: string;
  producerResponseAt?: string;
}> = [
  {
    id: 'dp-exposure:app-bcbs-consumer',
    dataProductId: 'dp-exposure',
    applicationId: 'app-bcbs-consumer',
    text: 'Critical for our BCBS 239 reporting. Exposure and limits data is always on time.',
    createdAt: '2025-03-01T10:00:00Z',
    producerResponse: 'Thank you. We maintain daily 06:00 UTC SLA for all risk consumers.',
    producerResponseAt: '2025-03-02T09:00:00Z',
  },
  {
    id: 'dp-customer-attr:app-bcbs-consumer',
    dataProductId: 'dp-customer-attr',
    applicationId: 'app-bcbs-consumer',
    text: 'Customer master is the backbone for our party data. Would like to see more attributes in the next release.',
    createdAt: '2025-03-05T14:30:00Z',
  },
  {
    id: 'dp-instrument-master:app-bcbs-consumer',
    dataProductId: 'dp-instrument-master',
    applicationId: 'app-bcbs-consumer',
    text: 'Instrument master is key for security reference. Currency code aligned to enterprise glossary helps our reporting.',
    createdAt: '2025-03-10T11:00:00Z',
    producerResponse: 'We keep currency_code and other reference attributes aligned with the enterprise glossary.',
    producerResponseAt: '2025-03-11T08:00:00Z',
  },
  {
    id: 'dp-transaction-holdings:app-bcbs-consumer',
    dataProductId: 'dp-transaction-holdings',
    applicationId: 'app-bcbs-consumer',
    text: 'Portfolio holdings and positions align well with our reporting. Client ID and currency mappings are consistent.',
    createdAt: '2025-03-10T11:00:00Z',
    producerResponse: 'Glad the glossary alignment helps. We use the same Client ID and Currency Code terms across Transaction and Party domains.',
    producerResponseAt: '2025-03-11T08:00:00Z',
  },
  {
    id: 'dp-transaction-holdings:app-reporting-consumer',
    dataProductId: 'dp-transaction-holdings',
    applicationId: 'app-reporting-consumer',
    text: 'Using this together with Party and Account data for consolidated reporting. Common glossary terms make joins straightforward.',
    createdAt: '2025-03-12T16:00:00Z',
  },
  {
    id: 'dp-party-accounts:app-bcbs-consumer',
    dataProductId: 'dp-party-accounts',
    applicationId: 'app-bcbs-consumer',
    text: 'Client account balances feed our dashboards. Balance and currency_code match the enterprise glossary.',
    createdAt: '2025-03-13T09:00:00Z',
  },
  {
    id: 'dp-party-accounts:app-reporting-consumer',
    dataProductId: 'dp-party-accounts',
    applicationId: 'app-reporting-consumer',
    text: 'We need more frequent refreshes for high-value accounts. Hourly is good but same-day adjustments would help.',
    createdAt: '2025-03-14T07:00:00Z',
  },
];
