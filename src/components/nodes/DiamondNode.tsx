import React from 'react';
import { NodeProps } from 'react-flow-renderer';
import BaseShapeNode from './BaseShapeNode';

/**
 * DiamondNode renders a diamond‑shaped flowchart node using the CSS
 * clip‑path property. It enforces equal width and height so the
 * diamond remains symmetrical.
 */
const DiamondNode: React.FC<NodeProps> = (props) => {
  return (
    <BaseShapeNode
      {...props}
      clipPath="polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
      equalSize={true}
    />
  );
};

export default DiamondNode;