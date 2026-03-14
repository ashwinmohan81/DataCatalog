import type { Connector } from './types';

export const connectors: Connector[] = [
  { id: 'conn-snowflake-1', name: 'Snowflake Risk DB', type: 'Snowflake', status: 'active', lastScanAt: '2025-03-14T05:00:00Z', schedule: '0 5 * * *' },
  { id: 'conn-bq-1', name: 'BigQuery Customer', type: 'BigQuery', status: 'active', lastScanAt: '2025-03-14T04:00:00Z', schedule: '0 4 * * *' },
  { id: 'conn-s3-1', name: 'S3 Raw Zone', type: 'S3', status: 'active', lastScanAt: '2025-03-13T03:00:00Z', schedule: '0 3 * * *' },
  { id: 'conn-kafka-1', name: 'Kafka Events', type: 'Kafka', status: 'error', lastScanAt: '2025-03-10T02:00:00Z', schedule: '0 2 * * *' },
];
