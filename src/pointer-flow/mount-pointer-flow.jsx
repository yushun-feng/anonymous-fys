import { createRoot } from 'react-dom/client';
import { PointerFlowBoard } from './PointerFlowBoard.jsx';
import { buildNodesAndEdges } from './build-model.js';

/**
 * @param {HTMLElement} host
 * @param {() => object} getPayload
 */
export function mountPointerFlow(host, getPayload) {
  const root = createRoot(host);

  function paint() {
    const payload = getPayload();
    const { nodes, edges, layoutHeight, layoutWidth, topBand } = buildNodesAndEdges(payload);
    root.render(
      <PointerFlowBoard
        nodes={nodes}
        edges={edges}
        height={layoutHeight}
        layoutWidth={layoutWidth}
        topBand={topBand}
        onSelect={payload.onSelect}
      />,
    );
  }

  paint();
  return {
    update: paint,
    unmount() {
      root.unmount();
    },
  };
}
