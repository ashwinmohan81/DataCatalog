import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { LineageGraph } from '../data/mock/types';
import styles from './LineageFlowCanvas.module.css';

const NODE_HEIGHT = 56;
const LAYER_GAP = 280;
const NODE_GAP = 80;

function columnsPerNode(graph: LineageGraph): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  graph.nodes.forEach((n) => { out[n.id] = []; });
  graph.edges.forEach((e) => {
    const col = e.columnName;
    if (!out[e.from].includes(col)) out[e.from].push(col);
    if (!out[e.to].includes(col)) out[e.to].push(col);
  });
  return out;
}

function getLayoutedElements(
  graph: LineageGraph,
  expandNodesByDefault: boolean
): { nodes: Node[]; edges: Edge[] } {
  const { nodes: rawNodes, edges: rawEdges } = graph;
  const nodeColumns = columnsPerNode(graph);
  const nodeIds = rawNodes.map((n) => n.id);
  const inDegree: Record<string, number> = {};
  const outEdges: Record<string, string[]> = {};
  nodeIds.forEach((id) => {
    inDegree[id] = 0;
    outEdges[id] = [];
  });
  rawEdges.forEach((e) => {
    inDegree[e.to] = (inDegree[e.to] ?? 0) + 1;
    (outEdges[e.from] = outEdges[e.from] ?? []).push(e.to);
  });

  const layers: string[][] = [];
  const assigned = new Set<string>();
  let currentLayer = nodeIds.filter((id) => inDegree[id] === 0);
  while (currentLayer.length > 0) {
    layers.push(currentLayer);
    currentLayer.forEach((id) => assigned.add(id));
    const nextLayer: string[] = [];
    currentLayer.forEach((id) => {
      (outEdges[id] ?? []).forEach((toId) => {
        if (assigned.has(toId)) return;
        const remaining = graph.edges.filter((e) => e.to === toId && !assigned.has(e.from)).length;
        if (remaining === 0) nextLayer.push(toId);
      });
    });
    nextLayer.forEach((id) => assigned.add(id));
    currentLayer = [...new Set(nextLayer)];
  }
  nodeIds.filter((id) => !assigned.has(id)).forEach((id) => layers.push([id]));

  const nodes: Node[] = [];
  layers.forEach((layer, layerIndex) => {
    layer.forEach((id, indexInLayer) => {
      const raw = rawNodes.find((n) => n.id === id)!;
      const x = layerIndex * LAYER_GAP;
      const y = indexInLayer * (NODE_HEIGHT + NODE_GAP);
      nodes.push({
        id,
        type: 'lineageNode',
        position: { x, y },
        data: {
          label: raw.name,
          nodeType: raw.type,
          system: raw.system,
          assetId: raw.assetId,
          columns: nodeColumns[id] ?? [],
          expanded: expandNodesByDefault,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });
  });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: `${e.from}-${e.to}`,
    source: e.from,
    target: e.to,
    type: 'smoothstep',
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed },
    label: e.columnName,
    labelStyle: { fill: 'var(--color-text-muted)', fontSize: 11 },
    labelBgStyle: { fill: 'var(--color-bg-elevated)' },
    labelBgBorderRadius: 4,
    labelBgPadding: [4, 8] as [number, number],
  }));

  return { nodes, edges };
}

function LineageFlowCanvasInner({ graph, expandNodesByDefault }: { graph: LineageGraph; expandNodesByDefault?: boolean }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => getLayoutedElements(graph, expandNodesByDefault === true),
    [graph, expandNodesByDefault]
  );
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={1.5}
      defaultEdgeOptions={{
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: 'var(--color-border)' },
      }}
      className={styles.reactFlowClass}
      proOptions={{ hideAttribution: true }}
    >
      <Controls showInteractive={false} className={styles.controls} />
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--color-border)" />
    </ReactFlow>
  );
}

function LineageNode({ id, data, selected }: NodeProps) {
  const nodeType = (data.nodeType as string) || 'transform';
  const columns = (data.columns as string[]) ?? [];
  const expanded = data.expanded === true;
  const { setNodes } = useReactFlow();
  const toggleExpanded = useCallback(() => {
    setNodes((ns) =>
      ns.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, expanded: !(n.data as { expanded?: boolean }).expanded } } : n
      )
    );
  }, [id, setNodes]);
  return (
    <div className={`${styles.lineageFlowNode} ${styles[`lineageFlowNode_${nodeType}`]} ${selected ? styles.lineageFlowNodeSelected : ''}`}>
      <Handle type="target" position={Position.Left} className={styles.handle} />
      <div className={styles.lineageFlowNodeBadge}>
        {nodeType === 'source' ? 'Source' : nodeType === 'destination' ? 'Destination' : 'Transform'}
      </div>
      <div className={styles.lineageFlowNodeLabel} title={data.system ? `${data.label} (${data.system})` : data.label}>
        {data.label}
      </div>
      {data.system && <div className={styles.lineageFlowNodeSystem}>{data.system}</div>}
      {columns.length > 0 && (
        <div className={styles.lineageFlowNodeColumns}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
            className={styles.lineageFlowNodeColumnsToggle}
            aria-expanded={expanded}
          >
            Columns ({columns.length}) {expanded ? '▼' : '▶'}
          </button>
          {expanded && (
            <ul className={styles.lineageFlowNodeColumnsList}>
              {columns.map((c) => (
                <li key={c} className={styles.lineageFlowNodeColumnsItem}>{c}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
}

const nodeTypes = { lineageNode: LineageNode };

export function LineageFlowCanvas({
  graph,
  expandNodesByDefault,
}: {
  graph: LineageGraph;
  expandNodesByDefault?: boolean;
}) {
  return (
    <div className={styles.lineageFlowWrap}>
      <ReactFlowProvider>
        <LineageFlowCanvasInner graph={graph} expandNodesByDefault={expandNodesByDefault} />
      </ReactFlowProvider>
    </div>
  );
}
