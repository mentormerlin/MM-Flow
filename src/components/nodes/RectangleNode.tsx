import React from 'react';
import { NodeProps } from 'react-flow-renderer';
import BaseShapeNode from './BaseShapeNode';

/**
 * RectangleNode renders a rectangular flowchart node. It simply delegates
 * the heavy lifting to the BaseShapeNode component with a small border
 * radius. The width and height are managed by the base component.
 */
const RectangleNode: React.FC<NodeProps> = (props) => {
  return <BaseShapeNode {...props} borderRadius="0.25rem" equalSize={false} />;
};

export default RectangleNode;