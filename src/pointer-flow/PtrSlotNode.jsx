import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

export const PtrSlotNode = memo(function PtrSlotNode({ data }) {
  const heap = data.entity === 'heap';
  const rootCls = [
    heap ? 'ptr-explorer__heap-card ptr-explorer__node' : 'ptr-explorer__slot',
    `is-${data.kind}`,
    data.isSel ? 'is-selected' : '',
    data.isRel ? 'is-related' : '',
    data.flash ? 'is-flash' : '',
    data.dead ? 'is-freed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const wrapStyle = data.nodeW ? { width: data.nodeW, maxWidth: data.nodeW } : undefined;

  return (
    <div className="ptr-explorer__flow-node" style={wrapStyle}>
      <div className={rootCls} role="button" tabIndex={0}>
        <Handle type="target" id="in" position={Position.Left} className="ptr-flow-handle" />
        <Handle type="target" id="in-r" position={Position.Right} className="ptr-flow-handle" />
        <Handle type="source" id="out" position={Position.Right} className="ptr-flow-handle" />
        <Handle type="source" id="out-l" position={Position.Left} className="ptr-flow-handle" />
        <span className="ptr-explorer__slot-head">{data.decl}</span>
        <div className="ptr-explorer__slot-body">
          {heap ? (
            <>
              <span className="ptr-explorer__heap-addr">{data.addr}</span>
              {data.rcLine ? <span className="ptr-explorer__rc">{data.rcLine}</span> : null}
              {data.edgeLine ? <span className="ptr-explorer__edge">{data.edgeLine}</span> : null}
              {data.dead ? <span className="ptr-explorer__freed-tag">已释放</span> : null}
            </>
          ) : (
            <>
              <span className="ptr-explorer__slot-name">{data.name}</span>
              <span className="ptr-explorer__val-wrap" dangerouslySetInnerHTML={{ __html: data.valueHtml }} />
              <span className="ptr-explorer__slot-addr">{data.addr}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
