
import React, { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { ComponentInstance, ComponentType } from '../../../domain/Component';
import { ComponentRegistryService } from '../../../application/services/ComponentRegistryService';
import { DragDropUsecase } from '../../../application/usecases/DragDropUsecase';
import { 
  treeAtom, 
  selectedIdAtom, 
  addComponentAtom, 
  deleteComponentAtom, 
  isPublishingAtom, 
  publishResultAtom,
  publishConfigAtom
} from '../../../infrastructure/state/atoms';
import { 
  ButtonRenderer, 
  TagRenderer, 
  MetricCardRenderer, 
  DataTableRenderer, 
  ChartRenderer, 
  RemoteWidgetRenderer 
} from '../Renderer/RendererComponents';
import { Trash2, Info, Box, CloudUpload, Loader2, CheckCircle } from 'lucide-react';

const ComponentWrapper: React.FC<{
  node: ComponentInstance;
  depth: number;
}> = ({ node, depth }) => {
  const [selectedId, setSelectedId] = useAtom(selectedIdAtom);
  const deleteComponent = useSetAtom(deleteComponentAtom);
  const addComponent = useSetAtom(addComponentAtom);
  
  const [isOver, setIsOver] = useState(false);
  const def = ComponentRegistryService.get(node.type);
  const isSelected = selectedId === node.id;
  const isContainer = def.isContainer;

  const renderContent = () => {
    switch (node.type) {
      case 'Button': return <ButtonRenderer {...node.props} />;
      case 'Tag': return <TagRenderer {...node.props} />;
      case 'MetricCard': return <MetricCardRenderer {...node.props} />;
      case 'DataTable': return <DataTableRenderer {...node.props} />;
      case 'Chart': return <ChartRenderer {...node.props} />;
      case 'RemoteWidget': return <RemoteWidgetRenderer {...node.props} />;
      case 'Container': 
        return (
          <div className={`
             min-h-[100px] w-full transition-colors duration-200 rounded
             ${node.props.padding} ${node.props.layout === 'flex-row' ? 'flex flex-row space-x-2' : 'flex flex-col space-y-2'}
             ${isOver && !isSelected ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset' : ''}
          `}
          style={{
             backgroundColor: node.props.background,
             borderColor: node.props.borderColor,
             borderWidth: node.props.borderWidth
          }}
          >
            {node.children.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 m-2 rounded bg-white/50">
                <Box size={20} className="mb-2 opacity-50"/>
                <span className="text-xs">Drop items here</span>
              </div>
            ) : (
              node.children.map(child => (
                <ComponentWrapper 
                  key={child.id} 
                  node={child} 
                  depth={depth + 1}
                />
              ))
            )}
          </div>
        );
      default: return null;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isContainer) setIsOver(true);
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

  return (
    <div 
      className={`relative group ${isSelected ? 'z-10' : 'z-0'} ${depth === 0 ? 'h-full' : ''}`}
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
      
      <div className={`
        relative rounded transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-600 ring-offset-2' : 'hover:ring-1 hover:ring-blue-300 ring-offset-1'}
        ${depth === 0 ? 'h-full' : ''}
      `}>
         {renderContent()}
      </div>
    </div>
  );
};

export const CanvasPanel: React.FC = () => {
  const [tree] = useAtom(treeAtom);
  const [isPublishing] = useAtom(isPublishingAtom);
  const [publishResult, setPublishResult] = useAtom(publishResultAtom);
  
  const addComponent = useSetAtom(addComponentAtom);
  const publishConfig = useSetAtom(publishConfigAtom);

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/react-dnd-component') as ComponentType;
    if (type) {
        const newComponent = DragDropUsecase.createComponentInstance(type);
        addComponent({ newItem: newComponent });
    }
  };

  return (
    <div 
      className="flex-1 bg-gray-100 flex flex-col h-full overflow-hidden relative"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleRootDrop}
    >
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <h1 className="text-lg font-bold text-gray-800">OpsCanvas</h1>
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2 text-xs text-gray-500">
             <Info size={14} />
             <span>Drag & Drop Configurator</span>
           </div>
           <button 
             onClick={publishConfig}
             disabled={isPublishing}
             className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
           >
             {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
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
                <p className="text-sm opacity-30 mt-2">Drag Basic or Data components here to start</p>
             </div>
           ) : (
             <div className="space-y-4 relative z-0">
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
