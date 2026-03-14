import type { DQRule, DQRuleTemplate, DQDimension, DQRuleType } from '../data/mock/types';

/** Display labels for DQ dimensions. */
export const DQ_DIMENSION_LABELS: Record<DQDimension, string> = {
  correctness: 'Correctness',
  completeness: 'Completeness',
  timeliness: 'Timeliness',
  uniqueness: 'Uniqueness',
  validity: 'Validity',
  consistency: 'Consistency',
};

const RULE_TYPE_TO_DIMENSION: Record<DQRuleType, DQDimension> = {
  null_check: 'completeness',
  uniqueness: 'uniqueness',
  range: 'validity',
  regex: 'validity',
  custom_sql: 'correctness',
};

/** All dimension ids in display order. */
export const DQ_DIMENSION_IDS: DQDimension[] = [
  'correctness',
  'completeness',
  'timeliness',
  'uniqueness',
  'validity',
  'consistency',
];

/**
 * Resolve the DQ dimension for a rule. Uses rule.dimension if set, else template.dimension, else derived from rule.type.
 */
export function getRuleDimension(
  rule: DQRule,
  getTemplate?: (templateId: string) => DQRuleTemplate | undefined
): DQDimension {
  if (rule.dimension) return rule.dimension;
  if (rule.templateId && getTemplate) {
    const t = getTemplate(rule.templateId);
    if (t?.dimension) return t.dimension;
  }
  return RULE_TYPE_TO_DIMENSION[rule.type];
}
