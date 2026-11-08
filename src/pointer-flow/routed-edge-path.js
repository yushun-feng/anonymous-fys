/** @param {number} columnCount */
export function layoutMetrics(columnCount) {
  const colW = 352;
  const rowH = 126;
  const titleH = 30;
  const ox = 20;
  const oy = 16;
  const nodeW = 278;
  const topBand = 28;
  /** 与 .ptr-explorer__flow-node .ptr-explorer__slot { min-height } 一半对齐 */
  const cardH = 96;
  const cardPortY = cardH / 2;
  return { colW, rowH, titleH, ox, oy, nodeW, topBand, columnCount, cardH, cardPortY };
}