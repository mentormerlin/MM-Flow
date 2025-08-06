import React, { useRef } from 'react';
import { Node, Edge } from 'react-flow-renderer';

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onExportDoc: () => void;
  onSave: () => void;
  onLoad: (file: File) => void;
}

/*
 * The Toolbar component renders controls for creating new nodes,
 * performing undo/redo actions and exporting or saving/loading
 * diagrams. Each shape icon is draggable; the drag data contains
 * the React Flow node type. Export buttons call the appropriate
 * callbacks supplied by the parent component.
 */
const Toolbar: React.FC<ToolbarProps> = ({
  onUndo,
  onRedo,
  onExportPng,
  onExportPdf,
  onExportDoc,
  onSave,
  onLoad,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, type: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoad(file);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
      {/* Shape tools */}
      <div className="flex gap-3 items-center">
        {/* Rectangle */}
        <div
          className="w-8 h-6 bg-accent border-2 border-primary cursor-grab flex items-center justify-center"
          draggable
          onDragStart={(e) => handleDragStart(e, 'rectangleNode')}
          title="Rectangle"
        />
        {/* Circle */}
        <div
          className="w-8 h-8 bg-accent border-2 border-primary rounded-full cursor-grab flex items-center justify-center"
          draggable
          onDragStart={(e) => handleDragStart(e, 'circleNode')}
          title="Circle"
        />
        {/* Diamond */}
        <div
          className="w-8 h-8 bg-accent border-2 border-primary cursor-grab flex items-center justify-center"
          style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
          draggable
          onDragStart={(e) => handleDragStart(e, 'diamondNode')}
          title="Diamond"
        />
        {/* Arrow */}
        <div
          className="w-10 h-8 bg-accent border-2 border-primary cursor-grab flex items-center justify-center"
          style={{ clipPath: 'polygon(0% 50%, 65% 50%, 65% 25%, 100% 50%, 65% 75%, 65% 50%, 0% 50%)' }}
          draggable
          onDragStart={(e) => handleDragStart(e, 'arrowNode')}
          title="Arrow"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 items-center">
        <button
          type="button"
          onClick={onUndo}
          className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300"
          title="Undo"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300"
          title="Redo"
        >
          Redo
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300"
          title="Save Diagram"
        >
          Save
        </button>
        <button
          type="button"
          onClick={triggerFileSelect}
          className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300"
          title="Load Diagram"
        >
          Load
        </button>
        <button
          type="button"
          onClick={onExportPng}
          className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300"
          title="Export as PNG"
        >
          PNG
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300"
          title="Export as PDF"
        >
          PDF
        </button>
        <button
          type="button"
          onClick={onExportDoc}
          className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 border border-gray-300"
          title="Export as DOCX"
        >
          DOC
        </button>
      </div>
      {/* Hidden file input for loading diagrams */}
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default Toolbar;