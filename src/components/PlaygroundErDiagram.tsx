import { useMemo, useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { DataAsset } from '../data/mock/types';
import type { SuggestedRelationship, ErMatchReason } from '../utils/playgroundErDiscovery';
import styles from './PlaygroundErDiagram.module.css';

const REASON_LABEL: Record<ErMatchReason, string> = {
  glossary: 'Glossary term',
  logical_attribute: 'Logical attribute',
  name_type: 'Name + type',
};

const NODE_WIDTH = 200;
const NODE_HEIGHT = 220;
const GAP = 120;
const PAGE_SIZE = 5;

export interface ErEntityData {
  assetId: string;
  displayName: string;
  /** All columns for this asset */
  columns: Array<{ id: string; name: string }>;
  /** Current page (0-based) for attribute pagination */
  page: number;
  totalPages: number;
  onPageChange: (assetId: string, delta: number) => void;
}

function getVisibleColumnIds(assetId: string, assets: DataAsset[], assetPage: Record<string, number>): Set<string> {
  const asset = assets.find((a) => a.id === assetId);
  if (!asset) return new Set();
  const page = assetPage[assetId] ?? 0;
  const start = page * PAGE_SIZE;
  const slice = asset.columns.slice(start, start + PAGE_SIZE);
  return new Set(slice.map((c) => c.id));
}

function buildNodesAndEdges(
  assets: DataAsset[],
  relationships: SuggestedRelationship[],
  assetPage: Record<string, number>,
  onPageChange: (assetId: string, delta: number) => void
): { nodes: Node[]; edges: Edge[] } {
  const visibleColumnIds = new Map<string, Set<string>>();
  assets.forEach((a) => {
    visibleColumnIds.set(a.id, getVisibleColumnIds(a.id, assets, assetPage));
  });
  const isVisible = (aid: string, cid: string) => visibleColumnIds.get(aid)?.has(cid) ?? false;

  const n = assets.length;
  const cols = Math.ceil(Math.sqrt(n));
  const nodes: Node[] = assets.map((asset, i) => {
    const allColumns = asset.columns.map((c) => ({ id: c.id, name: c.name }));
    const page = assetPage[asset.id] ?? 0;
    const totalPages = Math.max(1, Math.ceil(asset.columns.length / PAGE_SIZE));
    const row = Math.floor(i / cols);
    const col = i % cols;
    return {
      id: asset.id,
      type: 'erEntity',
      position: { x: col * (NODE_WIDTH + GAP), y: row * (NODE_HEIGHT + GAP) },
      data: {
        assetId: asset.id,
        displayName: asset.displayName,
        columns: allColumns,
        page,
        totalPages,
        onPageChange,
      } satisfies ErEntityData,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });

  /* Use column handles when both columns are visible; otherwise fallback to "default" handle so the edge always renders */
  const edges: Edge[] = relationships.map((r, i) => ({
    id: `rel-${r.assetIdA}-${r.columnIdA}-${r.assetIdB}-${r.columnIdB}-${i}`,
    source: r.assetIdA,
    sourceHandle: isVisible(r.assetIdA, r.columnIdA) ? r.columnIdA : 'default',
    target: r.assetIdB,
    targetHandle: isVisible(r.assetIdB, r.columnIdB) ? r.columnIdB : 'default',
    type: 'smoothstep',
    animated: true,
    label: REASON_LABEL[r.reason],
    labelStyle: { fill: 'var(--color-text)', fontSize: 10 },
    labelBgStyle: { fill: 'var(--color-bg-elevated)' },
    labelBgBorderRadius: 4,
    labelBgPadding: [4, 6] as [number, number],
    style: { stroke: 'var(--color-primary)', strokeWidth: 2 },
  }));

  return { nodes, edges };
}

function ErEntityNode({ data, selected }: NodeProps<ErEntityData>) {
  const { assetId, displayName, columns, page, totalPages, onPageChange } = data;
  const start = page * PAGE_SIZE;
  const visibleColumns = (columns ?? []).slice(start, start + PAGE_SIZE);
  const total = columns?.length ?? 0;

  const handlePrev = () => onPageChange(assetId, -1);
  const handleNext = () => onPageChange(assetId, 1);

  return (
    <div className={`${styles.erEntityNode} ${selected ? styles.erEntityNodeSelected : ''}`}>
      <div className={styles.erEntityHeader}>{displayName}</div>
      <ul className={styles.erEntityColumnsList}>
        {visibleColumns.map((col) => (
          <li key={col.id} className={styles.erEntityColumn}>
            <Handle type="target" position={Position.Left} id={col.id} className={styles.erHandle} />
            <span className={styles.erEntityColumnName}>{col.name}</span>
            <Handle type="source" position={Position.Right} id={col.id} className={styles.erHandle} />
          </li>
        ))}
      </ul>
      {/* Fallback handles so edges always have a valid connection when column is not on current page */}
      <Handle type="target" position={Position.Left} id="default" className={styles.erHandle} />
      <Handle type="source" position={Position.Right} id="default" className={styles.erHandle} />
      {total > PAGE_SIZE && (
        <div className={styles.erEntityPagination}>
          <span className={styles.erEntityPaginationLabel}>
            {start + 1}-{Math.min(start + PAGE_SIZE, total)} of {total}
          </span>
          <div className={styles.erEntityPaginationButtons}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={page <= 0}
              className={styles.erEntityPageBtn}
              aria-label="Previous attributes"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={page >= totalPages - 1}
              className={styles.erEntityPageBtn}
              aria-label="Next attributes"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { erEntity: ErEntityNode };

function PlaygroundErDiagramInner({ assets, relationships }: { assets: DataAsset[]; relationships: SuggestedRelationship[] }) {
  const [assetPage, setAssetPage] = useState<Record<string, number>>({});
  const onPageChange = useCallback((assetId: string, delta: number) => {
    setAssetPage((prev) => {
      const page = prev[assetId] ?? 0;
      const asset = assets.find((a) => a.id === assetId);
      const totalPages = asset ? Math.max(1, Math.ceil(asset.columns.length / PAGE_SIZE)) : 1;
      const nextPage = Math.max(0, Math.min(totalPages - 1, page + delta));
      return { ...prev, [assetId]: nextPage };
    });
  }, [assets]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildNodesAndEdges(assets, relationships, assetPage, onPageChange),
    [assets, relationships, assetPage, onPageChange]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.2}
      maxZoom={1.5}
      className={styles.reactFlowClass}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'var(--color-primary)', strokeWidth: 2 },
      }}
    >
      <Controls showInteractive={false} className={styles.controls} />
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--color-border)" />
    </ReactFlow>
  );
}

export function PlaygroundErDiagram({
  assets,
  relationships,
}: {
  assets: DataAsset[];
  relationships: SuggestedRelationship[];
}) {
  return (
    <div className={styles.erDiagramWrap}>
      <ReactFlowProvider>
        <PlaygroundErDiagramInner assets={assets} relationships={relationships} />
      </ReactFlowProvider>
    </div>
  );
}
