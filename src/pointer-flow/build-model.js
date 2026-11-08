import { MarkerType } from '@xyflow/react';
import { layoutMetrics } from './routed-edge-path.js';

/** 端口侧：跨列朝目标张开；同列一律左口出/左口入（竖槽在列内侧） */
export function linkSides(fromCol, toCol, sy, ty) {
  if (fromCol >= 0 && toCol >= 0 && fromCol !== toCol) {
    return fromCol < toCol
      ? { from: 'right', to: 'left' }
      : { from: 'left', to: 'right' };
  }
  if (typeof sy === 'number' && typeof ty === 'number' && ty < sy - 8) {
    return { from: 'left', to: 'left' };
  }
  return { from: 'right', to: 'left' };
}

const STROKE = {
  raw: 'var(--ptr-raw)',
  raw2: '#7ec8ff',
  unique: 'var(--ptr-unique)',
  shared: 'var(--ptr-shared)',
  weak: 'var(--ptr-weak)',
  dangling: 'var(--ptr-danger)',
  cycle: 'var(--ptr-danger)',
  solid: 'var(--ptr-raw)',
};

export function buildNodesAndEdges(payload) {
  const { columns, selected, related, flashId, arrows } = payload;
  const L = layoutMetrics(columns.length);
  const nodes = [];
  const idToCol = {};
  const idToPos = {};

  columns.forEach((col, ci) => {
    nodes.push({
      id: `_coltitle_${ci}`,
      type: 'colTitle',
      position: { x: L.ox + ci * L.colW, y: L.oy + L.topBand + 2 },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: 0,
      data: { title: col.title, nodeW: L.nodeW },
    });
    col.items.forEach((item, ri) => {
      const x = L.ox + ci * L.colW;
      const y = L.oy + L.topBand + L.titleH + ri * L.rowH;
      idToCol[item.id] = ci;
      idToPos[item.id] = { x, y };
      nodes.push({
        id: item.id,
        type: 'ptrSlot',
        position: { x, y },
        draggable: false,
        zIndex: 2,
        data: {
          ...item,
          nodeW: L.nodeW,
          isSel: selected === item.id,
          isRel: related?.has(item.id) ?? false,
          flash: flashId === item.id,
        },
      });
    });
  });

  const corridor = {};
  let topLanes = 0;
  const edges = [];
  for (const a of arrows) {
    if (a.style === 'null' || !a.to) continue;
    const fromCol = idToCol[a.from] ?? -1;
    const toCol = idToCol[a.to] ?? -1;
    const span = fromCol >= 0 && toCol >= 0 ? Math.abs(fromCol - toCol) : 1;
    const posA = idToPos[a.from];
    const posB = idToPos[a.to];
    const sides = linkSides(fromCol, toCol, posA?.y, posB?.y);
    const dim = selected && related && !related.has(a.from) && !(a.to && related.has(a.to));
    const color = STROKE[a.style] || STROKE.solid;
    const dashed = a.style === 'weak' || a.style === 'dangling';

    let laneIdx = 0;
    if (span >= 2) {
      const key = `${fromCol}>${toCol}`;
      laneIdx = corridor[key] || 0;
      corridor[key] = laneIdx + 1;
      topLanes = Math.max(topLanes, laneIdx + 1);
    } else if (span === 1) {
      const key = `g:${Math.min(fromCol, toCol)}-${Math.max(fromCol, toCol)}`;
      laneIdx = corridor[key] || 0;
      corridor[key] = laneIdx + 1;
    } else if (fromCol === toCol && fromCol >= 0) {
      const key = `v:${fromCol}`;
      laneIdx = corridor[key] || 0;
      corridor[key] = laneIdx + 1;
    }

    edges.push({
      id: `${a.from}>${a.to}`,
      source: a.from,
      target: a.to,
      sourceHandle: sides.from === 'left' ? 'out-l' : 'out',
      targetHandle: sides.to === 'left' ? 'in' : 'in-r',
      type: 'ptrRouted',
      zIndex: 1,
      data: {
        fromCol,
        toCol,
        span,
        laneIdx,
        layout: L,
        sides,
      },
      markerEnd: { type: MarkerType.ArrowClosed, width: 22, height: 22, color },
      style: {
        stroke: color,
        strokeWidth: 2.5,
        opacity: dim ? 0.36 : 0.98,
        strokeDasharray: dashed ? '6 5' : undefined,
      },
    });
  }

  const maxRows = Math.max(1, ...columns.map((c) => c.items.length));
  const layoutHeight =
    L.oy + L.topBand + L.titleH + L.rowH * maxRows + 48 + Math.max(0, topLanes - 1) * 14;
  const layoutWidth = L.ox * 2 + L.colW * columns.length;
  return {
    nodes,
    edges,
    layoutHeight,
    layoutWidth,
    nodeW: L.nodeW,
    topBand: L.topBand,
  };
}
