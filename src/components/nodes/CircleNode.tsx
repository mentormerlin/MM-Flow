import React from 'react';
import { NodeProps } from 'react-flow-renderer';
import BaseShapeNode from './BaseShapeNode';

/**
 * CircleNode renders a circular flowchart node by applying a full border
 * radius and enforcing equal width and height through the BaseShapeNode
 * property equalSize. The clipPath is left undefined so borderRadius
 * takes precedence.
 */
const CircleNode: React.FC<NodeProps> = (props) => {
  return <BaseShapeNode {...props} borderRadius="50%" equalSize={true} />;
};

export default CircleNode;