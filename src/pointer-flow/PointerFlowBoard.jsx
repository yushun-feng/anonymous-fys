import { memo } from 'react';
import { Background, ReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ColTitleNode } from './ColTitleNode.jsx';
import { PtrSlotNode } from './PtrSlotNode.jsx';
import { PtrRoutedEdge } from './PtrRoutedEdge.jsx';

const nodeTypes = { ptrSlot: PtrSlotNode, colTitle: ColTitleNode };
const edgeTypes = { ptrRouted: PtrRoutedEdge };

const FlowCanvas = memo(function FlowCanvas({
  nodes,
  edges,
  layoutWidth,
  height,
  topBand,
  onSelect,
}) {
  const viewH = Math.min(520, Math.max(360, height || 400));

  return (
    <div
      className="ptr-explorer__flow-canvas"
      style={{
        height: viewH,
        width: '100%',
        minWidth: Math.min(layoutWidth, 520),
        '--ptr-flow-top-band': `${topBand || 28}px`,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        panActivationKeyCode="Space"
        panOnScroll
        preventScrolling={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        selectionOnDrag={false}
        elevateNodesOnSelect={false}
        elevateEdgesOnSelect={false}
        autoPanOnNodeDrag={false}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={1}
        maxZoom={1}
        translateExtent={[
          [-120, -60],
          [layoutWidth + 120, (height || 400) + 120],
        ]}
        onNodeClick={(_, node) => {
          if (String(node.id).startsWith('_coltitle_')) return;
          onSelect?.(node.id);
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.02)" gap={24} size={1} />
      </ReactFlow>
    </div>
  );
});

export const PointerFlowBoard = memo(function PointerFlowBoard(props) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
});
