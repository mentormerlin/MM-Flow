import React, { useState } from 'react';
import { Handle, NodeProps, Position } from 'react-flow-renderer';

export interface BaseShapeNodeProps extends NodeProps {
  /** CSS clip-path string used to define custom shapes like diamond or arrow */
  clipPath?: string;
  /** CSS border radius for rounded shapes such as circles */
  borderRadius?: string;
  /** When true the shape maintains equal width and height (useful for circles) */
  equalSize?: boolean;
}

/**
 * BaseShapeNode provides a generic implementation for all shape nodes used
 * in the flowchart. It handles text editing via double click, styling
 * consistent with the Mentor Merlin brand and exposes four connection
 * handles on each side of the node. Child components supply specific
 * clip-paths or border-radius values to achieve different shapes.
 */
const BaseShapeNode: React.FC<BaseShapeNodeProps> = ({ id, data, clipPath, borderRadius, equalSize }) => {
  const [editing, setEditing] = useState(false);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditing(false);
    const value = e.target.value.trim();
    if (data?.onChangeLabel) {
      data.onChangeLabel(id, value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement | HTMLTextAreaElement).blur();
    }
  };

  const baseStyle: React.CSSProperties = {
    backgroundColor: '#0A75C2',
    border: '2px solid #013A8E',
    color: '#ffffff',
    padding: 8,
    borderRadius: borderRadius,
    clipPath: clipPath,
    minWidth: equalSize ? 100 : 120,
    minHeight: equalSize ? 100 : 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'default',
    textAlign: 'center',
    overflow: 'hidden',
  };

  return (
    <div style={baseStyle} onDoubleClick={handleDoubleClick}>
      {editing ? (
        <input
          autoFocus
          defaultValue={data?.label || ''}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent text-white outline-none text-center"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {data?.label || 'Double-click to edit'}
        </div>
      )}
      {/* Connection handles */}
      <Handle type="source" position={Position.Right} id="right" style={{ background: '#01579B' }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: '#01579B' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#01579B' }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: '#01579B' }} />
    </div>
  );
};

export default BaseShapeNode;