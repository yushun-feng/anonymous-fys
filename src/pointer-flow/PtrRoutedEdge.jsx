import { BaseEdge } from '@xyflow/react';
import { buildEdgePath } from '../lib/ptr-edge-paths.js';

export function PtrRoutedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
  markerEnd,
}) {
  const sides = data?.sides ?? { from: 'right', to: 'left' };
  const sx = sourceX;
  const sy = sourceY;
  const tx = targetX;
  const ty = targetY;

  const path = buildEdgePath({
    sx,
    sy,
    tx,
    ty,
    fromCol: data?.fromCol ?? -1,
    toCol: data?.toCol ?? -1,
    laneIdx: data?.laneIdx ?? 0,
    sourcePos: sides.from,
    targetPos: sides.to,
    layout: data?.layout ?? null,
  });

  return <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} interactionWidth={0} />;
}
