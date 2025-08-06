import React from 'react';
import { NodeProps } from 'react-flow-renderer';
import BaseShapeNode from './BaseShapeNode';

/**
 * ArrowNode renders a right‑pointing arrow using a CSS clip‑path. The
 * node has a rectangular base on the left and a triangular head on the
 * right. It inherits the default sizing behaviour from BaseShapeNode.
 */
const ArrowNode: React.FC<NodeProps> = (props) => {
  // Clip path draws a rightwards arrow. Adjust percentages to tweak the arrow shape.
  const arrowClip =
    'polygon(0% 50%, 60% 50%, 60% 30%, 100% 50%, 60% 70%, 60% 50%, 0% 50%)';
  return <BaseShapeNode {...props} clipPath={arrowClip} equalSize={false} />;
};

export default ArrowNode;