import { memo } from 'react';

export const ColTitleNode = memo(function ColTitleNode({ data }) {
  const w = data.nodeW ? { width: data.nodeW, maxWidth: data.nodeW } : undefined;
  return (
    <p className="ptr-explorer__panel-title ptr-explorer__flow-coltitle" style={w}>
      {data.title}
    </p>
  );
});
