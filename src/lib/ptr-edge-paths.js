/**
 * 节点连线 — 与 Blender / React Flow 同源：端口法向伸出 + Bezier / SmoothStep
 */
import { getBezierPath, getSmoothStepPath, Position } from '@xyflow/system';

/** @param {'left' | 'right'} side */
function portToPosition(side) {
  return side === 'left' ? Position.Left : Position.Right;
}

/**
 * @param {{
 *   sx: number, sy: number, tx: number, ty: number,
 *   fromCol: number, toCol: number, laneIdx?: number,
 *   sourcePos: 'left' | 'right', targetPos: 'left' | 'right',
 *   layout?: { oy: number } | null,
 * }} p
 */
export function buildEdgePath(p) {
  const { sx, sy, tx, ty, fromCol, toCol, laneIdx = 0, sourcePos, targetPos, layout } = p;
  const span = fromCol >= 0 && toCol >= 0 ? Math.abs(fromCol - toCol) : 1;
  const sourcePosition = portToPosition(sourcePos);
  const targetPosition = portToPosition(targetPos);
  const offset = 22;
  const borderRadius = 10;

  if (span >= 2 && layout) {
    const centerY = layout.oy + 14 + laneIdx * 14;
    const [path] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition,
      targetX: tx,
      targetY: ty,
      targetPosition,
      centerY,
      offset,
      borderRadius,
    });
    return path;
  }

  if (fromCol >= 0 && toCol >= 0 && fromCol === toCol) {
    const [path] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition,
      targetX: tx,
      targetY: ty,
      targetPosition,
      offset,
      borderRadius,
      stepPosition: sourcePos === targetPos ? 0.35 : 0.5,
    });
    return path;
  }

  const [path] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition,
    targetX: tx,
    targetY: ty,
    targetPosition,
    curvature: 0.38,
  });
  return path;
}
