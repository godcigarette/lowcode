
import React, { useState, useRef, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { ComponentInstance, ComponentType } from '../../../domain/Component';
import { ComponentRegistryService } from '../../../application/services/ComponentRegistryService';
import { DragDropUsecase } from '../../../application/usecases/DragDropUsecase';
import { 
  treeAtom, 
  selectedIdAtom, 
  addComponentAtom, 
  deleteComponentAtom, 
  updateComponentAtom,
  isPublishingAtom, 
  publishResultAtom,
  publishConfigAtom,
  undoAtom,
  redoAtom,
  historyAtom
} from '../../../infrastructure/state/atoms';
import { COMPONENT_IMPLEMENTATIONS } from '../Renderer/RendererComponents';
import { Trash2, Info, Box, UploadCloud, Loader2, CheckCircle, ArrowDownRight, RotateCcw, RotateCw } from 'lucide-react';

const ComponentWrapper: React.FC<{
  node: ComponentInstance;
  depth: number;
}> = ({ node, depth }) => {
  const [selectedId, setSelectedId] = useAtom(selectedIdAtom);
  const deleteComponent = useSetAtom(deleteComponentAtom);
  const addComponent = useSetAtom(addComponentAtom);
  const updateComponent = useSetAtom(updateComponentAtom);
  
  const [isOver, setIsOver] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  const def = ComponentRegistryService.get(node.type);
  const isSelected = selectedId === node.id;
  const isContainer = def.isContainer;

  // Retrieve the Renderer from Registry
  const Renderer = COMPONENT_IMPLEMENTATIONS[node.type] || COMPONENT_IMPLEMENTATIONS['Container'];

  // Recursively render children
  const childrenNodes = node.children.map(child => (
    <ComponentWrapper 
      key={child.id} 
      node={child} 
      depth={depth + 1}
    />
  ));

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isContainer) {
      setIsOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isContainer) setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    
    if (isContainer) {
      const type = e.dataTransfer.getData('application/react-dnd-component') as ComponentType;
      if (type) {
         const newComponent = DragDropUsecase.createComponentInstance(type, node.id);
         addComponent({ newItem: newComponent, targetId: node.id });
      }
    }
  };

  // --- Resizing Logic ---
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!elementRef.current) return;

    const startX = e.clientX;
    const startY = e.clientY;
    
    // Get current dimensions
    const rect = elementRef.current.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      const newHeight = startHeight + (moveEvent.clientY - startY);
      
      if (elementRef.current) {
         updateComponent({
            id: node.id,
            updates: {
               props: {
                 ...node.props,
                 width: `${Math.max(50, newWidth)}px`,
                 height: `${Math.max(20, newHeight)}px`
               }
            }
         });
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div 
      className={`relative group ${isSelected ? 'z-10' : 'z-0'} box-border`}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(node.id);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isSelected && (
        <div className="absolute -top-3 -right-0 flex items-center bg-blue-600 rounded shadow-sm z-50 text-white">
             <span className="text-[10px] uppercase font-bold px-2 py-0.5">{def.label}</span>
             <button 
                onClick={(e) => { e.stopPropagation(); deleteComponent(node.id); }}
                className="p-1 hover:bg-red-500 rounded-r transition-colors border-l border-blue-500"
                title="Delete Component"
             >
               <Trash2 size={12} />
             </button>
        </div>
      )}
      
      <div 
        ref={elementRef}
        className={`
          relative rounded transition-all duration-75 box-border
          ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2' : 'hover:ring-1 hover:ring-blue-300 ring-offset-1'}
          ${isOver && !isSelected ? 'ring-2 ring-blue-300 ring-inset bg-blue-50/30' : ''}
        `}
      >
         <Renderer {...node.props} _isCanvas={true}>
            {childrenNodes}
         </Renderer>
         
         {/* Container Empty State Helper */}
         {isContainer && node.children.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none min-h-[50px]">
               <div className="flex flex-col items-center justify-center text-gray-400 opacity-40">
                 <Box size={20} className="mb-1"/>
                 <span className="text-[10px]">Empty {def.label}</span>
               </div>
            </div>
         )}

         {/* Resize Handle (Only if selected) */}
         {isSelected && (
           <div 
             className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-center justify-center text-blue-600 bg-white/50 rounded-tl"
             onMouseDown={handleResizeMouseDown}
           >
              <ArrowDownRight size={12} strokeWidth={3} />
           </div>
         )}
      </div>
    </div>
  );
};

export const CanvasPanel: React.FC = () => {
  const [tree] = useAtom(treeAtom);
  const [isPublishing] = useAtom(isPublishingAtom);
  const [publishResult, setPublishResult] = useAtom(publishResultAtom);
  const [history] = useAtom(historyAtom);
  
  const addComponent = useSetAtom(addComponentAtom);
  const publishConfig = useSetAtom(publishConfigAtom);
  const setSelectedId = useSetAtom(selectedIdAtom);
  
  const performUndo = useSetAtom(undoAtom);
  const performRedo = useSetAtom(redoAtom);

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/react-dnd-component') as ComponentType;
    if (type) {
        const newComponent = DragDropUsecase.createComponentInstance(type);
        addComponent({ newItem: newComponent });
    }
  };

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          performRedo();
        } else {
          e.preventDefault();
          performUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        performRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo]);

  return (
    <div 
      className="flex-1 bg-gray-100 flex flex-col h-full overflow-hidden relative"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleRootDrop}
      onClick={() => setSelectedId(null)}
    >
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <h1 className="text-lg font-bold text-gray-800">OpsCanvas</h1>
        <div className="flex items-center space-x-4">
           
           {/* Undo/Redo Controls */}
           <div className="flex items-center bg-gray-100 rounded p-0.5 space-x-0.5 border border-gray-200">
             <button
               onClick={(e) => { e.stopPropagation(); performUndo(); }}
               disabled={history.past.length === 0}
               className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
               title="Undo (Ctrl+Z)"
             >
               <RotateCcw size={14} />
             </button>
             <button
               onClick={(e) => { e.stopPropagation(); performRedo(); }}
               disabled={history.future.length === 0}
               className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
               title="Redo (Ctrl+Shift+Z)"
             >
               <RotateCw size={14} />
             </button>
           </div>

           <div className="h-4 w-px bg-gray-300 mx-2"></div>

           <div className="flex items-center space-x-2 text-xs text-gray-500">
             <Info size={14} />
             <span>Drag & Drop</span>
           </div>
           
           <button 
             onClick={(e) => { e.stopPropagation(); publishConfig(); }}
             disabled={isPublishing}
             className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
           >
             {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
             <span>{isPublishing ? 'Building...' : 'Publish'}</span>
           </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-8 relative">
        <div className="min-h-[800px] w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-8 relative transition-all duration-300">
           <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                style={{ 
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                    backgroundSize: '20px 20px' 
                }}>
           </div>

           {tree.length === 0 ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                <Box size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium opacity-40">Canvas is Empty</p>
                <p className="text-sm opacity-30 mt-2">Drag components here to start</p>
             </div>
           ) : (
             <div className="space-y-4 relative z-0 flex flex-col h-full">
               {tree.map(node => (
                 <ComponentWrapper 
                    key={node.id} 
                    node={node} 
                    depth={0}
                 />
               ))}
             </div>
           )}
        </div>
      </div>

      {/* Publish Success Modal */}
      {publishResult && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
           <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 transform transition-all animate-in fade-in zoom-in duration-200">
              <div className="flex items-center space-x-3 mb-4 text-green-600">
                 <CheckCircle size={24} />
                 <h3 className="text-lg font-bold">Published Successfully</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                 Your configuration has been compiled and deployed to the global CDN. You can now use the following Module Federation entry URL:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4 break-all font-mono text-xs text-gray-800">
                 {publishResult}
              </div>
              <div className="flex justify-end">
                 <button 
                   onClick={() => setPublishResult(null)}
                   className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm font-medium transition-colors"
                 >
                   Close
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
