import type { Notification } from './types';

export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'dq_failure',
    title: 'DQ rule failed: exposure_amount not null',
    body: 'Rule failed on Credit Exposure Fact. 12 rows with null exposure_amount.',
    at: '2025-03-14T05:35:00Z',
    read: false,
    linkAssetId: 'asset-exposure',
  },
  {
    id: 'n2',
    type: 'task_assigned',
    title: 'Change request assigned to you',
    body: 'Fix exposure_amount nulls – assigned to you by Data Quality System.',
    at: '2025-03-14T06:00:00Z',
    read: false,
    linkTaskId: 'task-2',
  },
  {
    id: 'n3',
    type: 'change_request',
    title: 'Task completed: Add exposure_amount_eur column',
    body: 'Jane Risk marked "Add exposure_amount_eur column" as done.',
    at: '2025-03-10T14:00:00Z',
    read: true,
    linkTaskId: 'task-1',
  },
  {
    id: 'n4',
    type: 'contract_approval',
    title: 'Data contract approved',
    body: 'Customer Attributes Data Contract v1 approved for consumption.',
    at: '2025-02-05T11:00:00Z',
    read: true,
    linkAssetId: 'asset-customer-attr',
  },
];
