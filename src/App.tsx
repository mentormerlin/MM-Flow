import React, { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  MarkerType,
  Position,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import Toolbar from './components/Toolbar';
import FlowCanvas from './components/FlowCanvas';
import Footer from './components/Footer';

// Utility function to generate a random position on the canvas. This
// spreads new nodes out horizontally to avoid overlap. Feel free to
// adjust the spread or use a more sophisticated layout algorithm.
function randomPosition() {
  const x = Math.random() * 600;
  const y = Math.random() * 400;
  return { x, y };
}

const App: React.FC = () => {
  // Diagram state. Nodes and edges are stored in local state so that
  // ReactFlow can render and update them. A small history stack
  // enables undo/redo functionality.
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  // History for undo/redo. Each entry holds a snapshot of nodes and
  // edges. When making a change, push the current state on history
  // before applying the change. Undo pops from history and pushes
  // onto redo; redo pops from redo and pushes back to history.
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const redoRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);

  /**
   * Push the current diagram state onto the undo history. This
   * function should be called immediately before applying a change to
   * either nodes or edges.
   */
  const pushToHistory = useCallback(() => {
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    // Clear the redo stack on a new change
    redoRef.current = [];
  }, [nodes, edges]);

  /**
   * Undo the last diagram change. Restores the previous nodes and
   * edges from the history stack and pushes the current state on to
   * the redo stack.
   */
  const handleUndo = useCallback(() => {
    const last = historyRef.current.pop();
    if (last) {
      redoRef.current.push({ nodes, edges });
      setNodes(last.nodes);
      setEdges(last.edges);
    }
  }, [nodes, edges]);

  /**
   * Redo the most recently undone change. Pops a snapshot from the
   * redo stack and pushes the current state back onto the history.
   */
  const handleRedo = useCallback(() => {
    const next = redoRef.current.pop();
    if (next) {
      historyRef.current.push({ nodes, edges });
      setNodes(next.nodes);
      setEdges(next.edges);
    }
  }, [nodes, edges]);

  /**
   * Generic handler to apply node changes coming from ReactFlow. The
   * applyNodeChanges utility merges the changes into the current
   * nodes. Before applying, we push the current state onto the undo
   * history.
   */
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      pushToHistory();
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [pushToHistory],
  );

  /**
   * Generic handler to apply edge changes. Works analogously to
   * onNodesChange.
   */
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      pushToHistory();
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [pushToHistory],
  );

  /**
   * Called when the user connects two handles. Creates a new edge
   * connecting the source and target nodes. Edges are styled with
   * Mentor Merlin colours and arrow heads. The current state is
   * pushed onto the history before the update.
   */
  const onConnect = useCallback(
    (connection: Connection) => {
      pushToHistory();
      setEdges((eds) => {
        const id = uuidv4();
        const newEdge: Edge = {
          id,
          source: connection.source!,
          sourceHandle: connection.sourceHandle,
          target: connection.target!,
          targetHandle: connection.targetHandle,
          type: 'default',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#003366' },
          style: { stroke: '#003366', strokeWidth: 2 },
        };
        return [...eds, newEdge];
      });
    },
    [pushToHistory],
  );

  /**
   * Create a new node of the requested shape. Each node receives a
   * unique identifier and a random position on the canvas. Its label
   * defaults to the shape name but can be edited later. The current
   * state is pushed to the history before the update.
   */
  const createNode = useCallback(
    (shape: 'rectangle' | 'circle' | 'diamond') => {
      pushToHistory();
      setNodes((nds) => {
        const id = uuidv4();
        const position = randomPosition();
        const newNode: Node = {
          id,
          type: 'custom',
          position,
          data: { label: shape.charAt(0).toUpperCase() + shape.slice(1), shape },
        };
        return [...nds, newNode];
      });
    },
    [pushToHistory],
  );

  /**
   * Update a node's label. Finds the node by id and replaces its
   * label in the data. The current state is pushed to the history
   * before updating.
   */
  const onNodeLabelChange = useCallback(
    (id: string, label: string) => {
      pushToHistory();
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, label } } : node,
        ),
      );
    },
    [pushToHistory],
  );

  /**
   * Export the current diagram as a PNG. Uses the html-to-image
   * library to rasterise the ReactFlow wrapper into a PNG data URI
   * and then downloads it as a file. The promise chain is
   * asynchronous to avoid loading both libraries on initial load.
   */
  const exportAsPng = useCallback(() => {
    const flowWrapper = document.querySelector('.react-flow') as HTMLElement | null;
    if (!flowWrapper) return;
    import('html-to-image').then(({ toPng }) => {
      toPng(flowWrapper).then((dataUrl: string) => {
        const link = document.createElement('a');
        link.download = 'diagram.png';
        link.href = dataUrl;
        link.click();
      });
    });
  }, []);

  /**
   * Export the diagram as a PDF. Converts the canvas to PNG and then
   * writes it into a landscape PDF using jsPDF. The PDF dimensions
   * match the canvas size.
   */
  const exportAsPdf = useCallback(() => {
    const flowWrapper = document.querySelector('.react-flow') as HTMLElement | null;
    if (!flowWrapper) return;
    import('html-to-image').then(({ toPng }) => {
      toPng(flowWrapper).then((dataUrl: string) => {
        import('jspdf').then(({ default: jsPDF }) => {
          const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [flowWrapper.clientWidth, flowWrapper.clientHeight] });
          pdf.addImage(dataUrl, 'PNG', 0, 0, flowWrapper.clientWidth, flowWrapper.clientHeight);
          pdf.save('diagram.pdf');
        });
      });
    });
  }, []);

  /**
   * Export the diagram as a Word document (.docx). The diagram is
   * rendered to PNG and then embedded into a document using the
   * docx library. The resulting file is offered for download via
   * Blob.
   */
  const exportAsDoc = useCallback(() => {
    const flowWrapper = document.querySelector('.react-flow') as HTMLElement | null;
    if (!flowWrapper) return;
    import('html-to-image').then(({ toPng }) => {
      toPng(flowWrapper).then((dataUrl: string) => {
        import('docx').then(({ Document, Packer, Paragraph, ImageRun }) => {
          const base64 = dataUrl.split(',')[1];
          // Convert base64 to Uint8Array
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);

          const doc = new Document({});
          const image = new ImageRun({
            data: byteArray,
            transformation: {
              width: flowWrapper.clientWidth,
              height: flowWrapper.clientHeight,
            },
          });
          const paragraph = new Paragraph({ children: [image] });
          doc.addSection({ children: [paragraph] });
          Packer.toBlob(doc).then((blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'diagram.docx';
            anchor.click();
            window.URL.revokeObjectURL(url);
          });
        });
      });
    });
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header containing the toolbar and the Mentor Merlin logo */}
      <header className="flex items-center justify-between p-2 bg-white shadow-sm">
        <Toolbar
          onAddRectangle={() => createNode('rectangle')}
          onAddCircle={() => createNode('circle')}
          onAddDiamond={() => createNode('diamond')}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExportPng={exportAsPng}
          onExportPdf={exportAsPdf}
          onExportDoc={exportAsDoc}
        />
        <img
          src={process.env.PUBLIC_URL + '/MM_logo.png'}
          alt="Mentor Merlin logo"
          className="h-10 w-auto"
        />
      </header>
      {/* Main canvas area */}
      <main className="flex-1 bg-gray-50 overflow-hidden">
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeLabelChange={onNodeLabelChange}
        />
      </main>
      {/* Footer with branding */}
      <Footer />
    </div>
  );
};

export default App;
