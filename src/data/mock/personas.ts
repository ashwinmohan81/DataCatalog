import type { Persona } from './types';

export const personas: Persona[] = [
  { id: 'consumer', name: 'Data Consumer', homePath: '/marketplace', navEmphasis: ['Marketplace', 'Discover', 'Contracts'] },
  { id: 'steward', name: 'Data Steward', homePath: '/glossary', navEmphasis: ['Glossary', 'Quality', 'Tags'] },
  { id: 'owner', name: 'Data Owner', homePath: '/workflows', navEmphasis: ['My Assets', 'Workflows', 'Contracts'] },
  { id: 'engineer', name: 'Data Engineer', homePath: '/catalog', navEmphasis: ['Catalog', 'Domains', 'Connectors', 'Lineage'] },
  { id: 'regulator', name: 'Regulator', homePath: '/lineage', navEmphasis: ['Lineage', 'Glossary', 'Export'] },
];
