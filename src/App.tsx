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

function randomPosition() {
  const x = Math.random() * 600;
  const y = Math.random() * 400;
  return { x, y };
}

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const redoRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);

  const pushToHistory = useCallback(() => {
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    redoRef.current = [];
  }, [nodes, edges]);

  const handleUndo = useCallback(() => {
    const last = historyRef.current.pop();
    if (last) {
      redoRef.current.push({ nodes, edges });
      setNodes(last.nodes);
      setEdges(last.edges);
    }
  }, [nodes, edges]);

  const handleRedo = useCallback(() => {
    const next = redoRef.current.pop();
    if (next) {
      historyRef.current.push({ nodes, edges });
      setNodes(next.nodes);
      setEdges(next.edges);
    }
  }, [nodes, edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      pushToHistory();
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [pushToHistory]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      pushToHistory();
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [pushToHistory]
  );

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
    [pushToHistory]
  );

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
    [pushToHistory]
  );

  const onNodeLabelChange = useCallback(
    (id: string, label: string) => {
      pushToHistory();
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, label } } : node
        )
      );
    },
    [pushToHistory]
  );

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

  const exportAsPdf = useCallback(() => {
    const flowWrapper = document.querySelector('.react-flow') as HTMLElement | null;
    if (!flowWrapper) return;
    import('html-to-image').then(({ toPng }) => {
      toPng(flowWrapper).then((dataUrl: string) => {
        import('jspdf').then(({ default: jsPDF }) => {
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [flowWrapper.clientWidth, flowWrapper.clientHeight],
          });
          pdf.addImage(dataUrl, 'PNG', 0, 0, flowWrapper.clientWidth, flowWrapper.clientHeight);
          pdf.save('diagram.pdf');
        });
      });
    });
  }, []);

  const exportAsDoc = useCallback(() => {
    const flowWrapper = document.querySelector('.react-flow') as HTMLElement | null;
    if (!flowWrapper) return;
    import('html-to-image').then(({ toPng }) => {
      toPng(flowWrapper).then((dataUrl: string) => {
        import('docx').then(({ Document, Packer, Paragraph, ImageRun }) => {
          const base64 = dataUrl.split(',')[1];
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);

          const image = new ImageRun({
            data: byteArray,
            transformation: {
              width: flowWrapper.clientWidth,
              height: flowWrapper.clientHeight,
            },
          });

          const doc = new Document({
            sections: [
              {
                properties: {},
                children: [new Paragraph({ children: [image] })],
              },
            ],
          });

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
          alt="Mentor Merlin logo"
          className="h-10 w-auto"
        />
      </header>
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
      <Footer />
    </div>
  );
};

export default App;
