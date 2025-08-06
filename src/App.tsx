import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ConnectionMode,
  MarkerType,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
} from 'react-flow-renderer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, Media } from 'docx';
import { saveAs } from 'file-saver';
import Toolbar from './components/Toolbar';
import Footer from './components/Footer';
import { RectangleNode, CircleNode, DiamondNode, ArrowNode } from './components/nodes';

// Mapping of node types to React components. React Flow will render
// the appropriate component based on the node's `type` property.
const nodeTypes = {
  rectangleNode: RectangleNode,
  circleNode: CircleNode,
  diamondNode: DiamondNode,
  arrowNode: ArrowNode,
};

// Helper type for storing history entries. Each entry consists of
// deep copies of nodes and edges at a given point in time.
interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

/**
 * The App component holds the top level state for nodes and edges,
 * manages undo/redo history, exports diagrams in multiple formats
 * and wires up the UI components (toolbar, canvas, footer). All
 * callbacks that mutate state push a new entry onto the history
 * stack unless triggered by an undo/redo operation.
 */
const App: React.FC = () => {
  // Node and edge state managed by React Flow hooks. The third value
  // from useNodesState/useEdgesState is the built in change handler
  // which applies modifications triggered by drag, resize and other
  // interactions. We wrap these to capture history entries.
  const [nodes, setNodes] = useNodesState<Node[]>([]);
  const [edges, setEdges] = useEdgesState<Edge[]>([]);

  // Reference to the DOM element containing the React Flow canvas. This
  // is used when exporting diagrams to images or documents.
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // React Flow instance is stored here once the graph initializes. It
  // provides project(xy) which converts screen coordinates to graph
  // coordinates used for placing dropped nodes.
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // History of node/edge states for undo/redo. Each entry stores
  // serialisable copies of nodes and edges. We initialize with one
  // empty state so that undo is disabled until at least one change.
  const [history, setHistory] = useState<HistoryEntry[]>([{ nodes: [], edges: [] }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // A ref used to temporarily disable history pushes during undo/redo
  // operations to avoid recursive state updates.
  const skipHistoryRef = useRef(false);

  /**
   * Append a new history entry if history is not being skipped. This
   * function slices the history array up to the current index and
   * appends the new entry, discarding any 'redo' entries.
   */
  const pushHistory = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      if (skipHistoryRef.current) return;
      setHistory((prev) => {
        const historyPrefix = prev.slice(0, historyIndex + 1);
        return [...historyPrefix, { nodes: JSON.parse(JSON.stringify(newNodes)), edges: JSON.parse(JSON.stringify(newEdges)) }];
      });
      setHistoryIndex((idx) => idx + 1);
    },
    [historyIndex]
  );

  /**
   * Update handler for node changes triggered by React Flow. We wrap
   * the built in applyNodeChanges to produce an updated array and
   * record it in the history.
   */
  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        pushHistory(updatedNodes, edges);
        return updatedNodes;
      });
    },
    [edges, pushHistory]
  );

  /**
   * Update handler for edge changes. Similar to nodes, we apply
   * changes and push to history.
   */
  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        pushHistory(nodes, updatedEdges);
        return updatedEdges;
      });
    },
    [nodes, pushHistory]
  );

  /**
   * When a connection is made between two handles, add a new edge. We
   * customise the marker to include an arrow and set its colour.
   */
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const newEdge: Edge = {
          ...params,
          id: `${params.source}-${params.target}-${Date.now()}`,
          type: 'default',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#01579B' },
          style: { stroke: '#01579B', strokeWidth: 2 },
        } as Edge;
        const updatedEdges = addEdge(newEdge, eds);
        pushHistory(nodes, updatedEdges);
        return updatedEdges;
      });
    },
    [nodes, pushHistory]
  );

  /**
   * Allow dropping of nodes onto the canvas. Retrieve the node type
   * from the drag data, convert screen coords to graph coords and
   * append a new node with the appropriate type and default data.
   */
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const dataString = event.dataTransfer.getData('application/reactflow');
      if (!dataString) return;
      const { type } = JSON.parse(dataString);
      if (!type) return;
      if (!reactFlowBounds || !reactFlowInstance) return;
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode: Node = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: '', onChangeLabel: handleLabelChange },
      };
      setNodes((nds) => nds.concat(newNode));
      pushHistory([...nodes, newNode], edges);
    },
    [reactFlowInstance, nodes, edges, pushHistory]
  );

  /**
   * Enable drag over the canvas. Without this handler the drop event
   * will not fire. We set the dropEffect to 'move'.
   */
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Called when the React Flow instance is first initialised. We store
   * a reference so that we can convert screen coordinates to graph
   * coordinates during drops.
   */
  const onInit = useCallback((flow: any) => {
    setReactFlowInstance(flow);
  }, []);

  /**
   * Update a node's label when edited. The node id and new value are
   * passed from the Node component via data.onChangeLabel.
   */
  const handleLabelChange = useCallback(
    (id: string, value: string) => {
      setNodes((nds) => {
        const updatedNodes = nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: value, onChangeLabel: handleLabelChange } } : n));
        pushHistory(updatedNodes, edges);
        return updatedNodes;
      });
    },
    [edges, pushHistory]
  );

  /**
   * Undo the last operation by stepping one entry backwards in the
   * history. History is not modified when moving within it; we only
   * update the nodes/edges to the saved state.
   */
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      skipHistoryRef.current = true;
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setNodes(state.nodes.map((n) => ({ ...n, data: { ...n.data, onChangeLabel: handleLabelChange } })));
      setEdges(state.edges);
      setHistoryIndex(newIndex);
      // re-enable history push after this call stack flushes
      setTimeout(() => {
        skipHistoryRef.current = false;
      }, 0);
    }
  }, [history, historyIndex, handleLabelChange]);

  /**
   * Redo the next operation by stepping one entry forwards in the
   * history if it exists.
   */
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      skipHistoryRef.current = true;
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setNodes(state.nodes.map((n) => ({ ...n, data: { ...n.data, onChangeLabel: handleLabelChange } })));
      setEdges(state.edges);
      setHistoryIndex(newIndex);
      setTimeout(() => {
        skipHistoryRef.current = false;
      }, 0);
    }
  }, [history, historyIndex, handleLabelChange]);

  /**
   * Export the current diagram as a PNG file. We capture the canvas
   * element using html2canvas. The background is set to null so that
   * transparent areas remain transparent.
   */
  const exportPng = async () => {
    if (!reactFlowWrapper.current) return;
    const canvas = await html2canvas(reactFlowWrapper.current, { backgroundColor: null });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'diagram.png';
    link.click();
  };

  /**
   * Export the current diagram as a PDF file. We capture the canvas
   * using html2canvas and embed it directly into a jsPDF document.
   */
  const exportPdf = async () => {
    if (!reactFlowWrapper.current) return;
    const canvas = await html2canvas(reactFlowWrapper.current, { backgroundColor: '#FFFFFF' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'pt', [canvas.width, canvas.height]);
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('diagram.pdf');
  };

  /**
   * Export the diagram as a DOCX document. We add the captured image
   * into a docx file using the docx library. The file is saved via
   * the FileSaver utility.
   */
  const exportDoc = async () => {
    if (!reactFlowWrapper.current) return;
    const canvas = await html2canvas(reactFlowWrapper.current, { backgroundColor: '#FFFFFF' });
    const imgData = canvas.toDataURL('image/png');
    const response = await fetch(imgData);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const doc = new Document();
    const image = Media.addImage(doc, arrayBuffer);
    doc.addSection({ children: [new Paragraph(image)] });
    const docBlob = await Packer.toBlob(doc);
    saveAs(docBlob, 'diagram.docx');
  };

  /**
   * Save the diagram as a JSON file containing the nodes and edges.
   */
  const saveDiagram = () => {
    const dataStr = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    saveAs(blob, 'diagram.json');
  };

  /**
   * Load a diagram from a user‑selected JSON file. The file should
   * contain an object with `nodes` and `edges` properties. The
   * onChangeLabel callback is restored on every node to ensure
   * continued editability.
   */
  const loadDiagram = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.nodes && parsed.edges) {
          skipHistoryRef.current = true;
          const loadedNodes: Node[] = parsed.nodes.map((n: any) => ({ ...n, data: { ...n.data, onChangeLabel: handleLabelChange } }));
          const loadedEdges: Edge[] = parsed.edges;
          setNodes(loadedNodes);
          setEdges(loadedEdges);
          setHistory([{ nodes: JSON.parse(JSON.stringify(loadedNodes)), edges: JSON.parse(JSON.stringify(loadedEdges)) }]);
          setHistoryIndex(0);
          setTimeout(() => {
            skipHistoryRef.current = false;
          }, 0);
        }
      } catch (err) {
        console.error('Failed to load diagram:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Toolbar at the top */}
        <Toolbar
          onUndo={undo}
          onRedo={redo}
          onExportPng={exportPng}
          onExportPdf={exportPdf}
          onExportDoc={exportDoc}
          onSave={saveDiagram}
          onLoad={loadDiagram}
        />
        {/* Canvas wrapper used for exporting */}
        <div className="flex-1 relative bg-white" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            deleteKeyCode={46}
          >
            {/* A grid background helps users align elements neatly */}
            <Background gap={20} color="#E5E7EB" />
          </ReactFlow>
          {/* Branding logo in the upper right corner of the canvas */}
          <img
            src="/MM_logo.png"
            alt="Mentor Merlin logo"
            className="absolute top-2 right-2 w-28 h-auto pointer-events-none"
          />
        </div>
        {/* Footer at the bottom with branding */}
        <Footer />
      </div>
    </ReactFlowProvider>
  );
};

export default App;