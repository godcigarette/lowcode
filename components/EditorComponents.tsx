import React, { useState, useRef, useEffect } from 'react';
import { COMPONENT_REGISTRY } from '../constants';
import { ComponentDefinition, ComponentInstance, ComponentType, PropSchema } from '../types';
import { 
  ButtonRenderer, 
  TagRenderer, 
  MetricCardRenderer, 
  DataTableRenderer, 
  ChartRenderer, 
  RemoteWidgetRenderer,
  ComponentPreview 
} from './RendererComponents';
import { Trash2, GripVertical, Settings, Info, Box, CloudUpload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// --- Left Panel: Library with Hover Preview ---

export const ComponentLibrary: React.FC = () => {
  const categories = ['Basic', 'Data', 'Module Federation'];
  const [hoveredComp, setHoveredComp] = useState<{ type: ComponentType; y: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/react-dnd-component', type);
    e.dataTransfer.effectAllowed = 'copy';
    setHoveredComp(null); // Clear preview on drag
  };

  return (
    <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden relative">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Component Library</h2>
        <p className="text-xs text-gray-500 mt-1">Drag components to canvas</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={listRef}>
        {categories.map(cat => (
          <div key={cat}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">{cat} Components</h3>
            <div className="space-y-2">
              {Object.values(COMPONENT_REGISTRY)
                .filter(c => c.category === cat)
                .map(comp => (
                  <div
                    key={comp.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, comp.type)}
                    onMouseEnter={(e) => {
                       const rect = e.currentTarget.getBoundingClientRect();
                       setHoveredComp({ type: comp.type, y: rect.top });
                    }}
                    onMouseLeave={() => setHoveredComp(null)}
                    className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded cursor-move hover:border-blue-500 hover:shadow-sm transition-all group relative"
                  >
                    <div className="p-1.5 bg-white rounded border border-gray-200 text-gray-600 mr-3 group-hover:text-blue-600 group-hover:border-blue-200">
                      <comp.icon size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{comp.label}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hover Preview Tooltip */}
      {hoveredComp && (
        <div 
           className="fixed left-64 z-50 p-4 bg-white border border-gray-200 shadow-xl rounded-r-lg rounded-b-lg pointer-events-none transform -translate-y-1/2 ml-2"
           style={{ top: hoveredComp.y + 20 }}
        >
           <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Preview</h4>
           <div className="flex items-center justify-center bg-gray-50 p-4 rounded border border-gray-100 min-w-[120px]">
             <ComponentPreview type={hoveredComp.type} />
           </div>
           <div className="mt-2 text-[10px] text-gray-400 max-w-[150px]">
             {COMPONENT_REGISTRY[hoveredComp.type].category} Component
           </div>
        </div>
      )}
    </div>
  );
};

// --- Center Canvas ---

interface CanvasProps {
  tree: ComponentInstance[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDrop: (item: ComponentInstance, targetId?: string) => void;
  onDelete: (id: string) => void;
  onPublish: () => void;
  isPublishing: boolean;
  publishResult: string | null;
  closePublishModal: () => void;
}

const ComponentWrapper: React.FC<{
  node: ComponentInstance;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDrop: (item: ComponentInstance, targetId?: string) => void;
  onDelete: (id: string) => void;
  depth: number;
}> = ({ node, selectedId, onSelect, onDrop, onDelete, depth }) => {
  const [isOver, setIsOver] = useState(false);
  const def = COMPONENT_REGISTRY[node.type];
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
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onDrop={onDrop}
                  onDelete={onDelete}
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
         const newId = `comp_${Date.now()}`;
         const newComponent: ComponentInstance = {
           id: newId,
           type: type,
           props: { ...COMPONENT_REGISTRY[type].defaultProps },
           children: [],
           parentId: node.id
         };
         onDrop(newComponent, node.id);
      }
    }
  };

  return (
    <div 
      className={`relative group ${isSelected ? 'z-10' : 'z-0'} ${depth === 0 ? 'h-full' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isSelected && (
        <div className="absolute -top-3 -right-0 flex items-center bg-blue-600 rounded shadow-sm z-50 text-white">
             <span className="text-[10px] uppercase font-bold px-2 py-0.5">{def.label}</span>
             <button 
                onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
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

export const Canvas: React.FC<CanvasProps> = ({ 
  tree, 
  selectedId, 
  onSelect, 
  onDrop, 
  onDelete, 
  onPublish,
  isPublishing,
  publishResult,
  closePublishModal
}) => {
  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/react-dnd-component') as ComponentType;
    if (type) {
        const newId = `comp_${Date.now()}`;
        const newComponent: ComponentInstance = {
          id: newId,
          type: type,
          props: { ...COMPONENT_REGISTRY[type].defaultProps },
          children: [],
          parentId: null
        };
        onDrop(newComponent);
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
             onClick={onPublish}
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
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onDrop={onDrop}
                    onDelete={onDelete}
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
                   onClick={closePublishModal}
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

// --- Right Panel: Property Configuration ---

interface PropertyPanelProps {
  selectedComponent: ComponentInstance | null;
  onUpdate: (id: string, updates: Partial<ComponentInstance>) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedComponent, onUpdate }) => {
  const [loadingSchema, setLoadingSchema] = useState(false);

  // Effect to simulate fetching remote schema when moduleUrl changes
  useEffect(() => {
    if (!selectedComponent || selectedComponent.type !== 'RemoteWidget') return;
    
    const moduleUrl = selectedComponent.props.moduleUrl;
    
    // Only fetch if we have a URL and it doesn't already have a schema for this specific URL (simple check)
    // For demo purposes, we always fetch if it changes.
    
    setLoadingSchema(true);
    const timer = setTimeout(() => {
       // Mock logic: generate schema based on keywords in URL
       const newDynamicSchema: Record<string, PropSchema> = {};
       
       if (moduleUrl && moduleUrl.includes('user')) {
         newDynamicSchema['remoteUserType'] = {
           label: 'Remote User Type',
           type: 'select',
           options: ['Admin', 'Guest', 'SuperUser'],
           description: 'Loaded dynamically from User Module'
         };
         newDynamicSchema['remoteDebug'] = {
           label: 'Debug Mode',
           type: 'boolean'
         };
       } else if (moduleUrl && moduleUrl.includes('chart')) {
         newDynamicSchema['theme'] = {
           label: 'Chart Theme',
           type: 'select',
           options: ['Light', 'Dark', 'System']
         };
       }
       
       onUpdate(selectedComponent.id, {
         dynamicSchema: newDynamicSchema
       });
       setLoadingSchema(false);
    }, 1000);

    return () => clearTimeout(timer);
    // We only want to run this when moduleUrl changes specifically.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComponent?.props?.moduleUrl]);


  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
         <Settings size={48} className="mb-4 opacity-20" />
         <p className="text-sm">Select a component on the canvas to configure its properties, API, and events.</p>
      </div>
    );
  }

  const def = COMPONENT_REGISTRY[selectedComponent.type];
  // Merge static schema with dynamic schema
  const schema = { ...def.propSchema, ...(selectedComponent.dynamicSchema || {}) };

  const handleChange = (key: string, value: any) => {
    onUpdate(selectedComponent.id, {
      props: {
        ...selectedComponent.props,
        [key]: value
      }
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden shadow-xl z-20">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
            <def.icon className="text-blue-600" size={18} />
            <h2 className="text-sm font-bold text-gray-900">{def.label} Configuration</h2>
        </div>
        <p className="text-xs text-gray-500 mt-1 font-mono">ID: {selectedComponent.id}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Dynamic Schema Loading Indicator */}
        {selectedComponent.type === 'RemoteWidget' && loadingSchema && (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-2 rounded text-xs flex items-center mb-4">
             <Loader2 className="animate-spin w-3 h-3 mr-2" />
             Reading remote module props...
          </div>
        )}

        {(Object.entries(schema) as [string, PropSchema][]).map(([key, field]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {field.label}
              </label>
              {selectedComponent.dynamicSchema && selectedComponent.dynamicSchema[key] && (
                 <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded border border-purple-200">REMOTE</span>
              )}
            </div>
            
            {field.description && (
              <p className="text-[10px] text-gray-400 mb-1">{field.description}</p>
            )}
            
            {field.type === 'text' && (
              <input 
                type="text" 
                value={selectedComponent.props[key] || ''}
                onChange={e => handleChange(key, e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            )}

            {field.type === 'number' && (
              <input 
                type="number" 
                value={selectedComponent.props[key] || 0}
                onChange={e => handleChange(key, Number(e.target.value))}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            )}

            {field.type === 'boolean' && (
              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  checked={selectedComponent.props[key] || false}
                  onChange={e => handleChange(key, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Enabled</span>
              </div>
            )}

            {field.type === 'color' && (
              <div className="flex items-center space-x-2">
                <input 
                  type="color" 
                  value={selectedComponent.props[key] || '#ffffff'}
                  onChange={e => handleChange(key, e.target.value)}
                  className="h-8 w-12 border border-gray-300 p-0.5 rounded cursor-pointer"
                />
                <input 
                  type="text"
                  value={selectedComponent.props[key] || ''}
                  onChange={e => handleChange(key, e.target.value)}
                  className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border font-mono"
                />
              </div>
            )}

            {field.type === 'select' && (
              <select 
                value={selectedComponent.props[key] || ''}
                onChange={e => handleChange(key, e.target.value)}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
              >
                <option value="" disabled>Select option</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === 'json' && (
              <textarea 
                value={selectedComponent.props[key] || ''}
                onChange={e => handleChange(key, e.target.value)}
                rows={4}
                className="w-full text-xs font-mono border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-gray-50"
              />
            )}

            {field.type === 'api' && (
               <div className="flex items-center rounded-md shadow-sm">
                 <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs">
                   GET
                 </span>
                 <input
                   type="text"
                   value={selectedComponent.props[key] || ''}
                   onChange={e => handleChange(key, e.target.value)}
                   className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                 />
               </div>
            )}
             
            {field.type === 'event' && (
               <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="flex justify-between items-center mb-2">
                     <span className="font-semibold text-yellow-800">Event Handler</span>
                     <span className="bg-yellow-200 text-yellow-800 px-1.5 rounded text-[10px]">JS</span>
                  </div>
                  <select 
                    value={selectedComponent.props[key] || ''}
                    onChange={e => handleChange(key, e.target.value)}
                    className="w-full text-sm border-yellow-300 rounded-md focus:border-yellow-500 focus:ring-yellow-500 p-1.5 border bg-white mb-2"
                  >
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
               </div>
            )}
          </div>
        ))}
        
        {/* Linkage / Advanced Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
           <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Component Linkage</h3>
           <div className="bg-blue-50 p-3 rounded border border-blue-100 text-xs text-blue-700">
              <p className="mb-2"><strong>Context Sharing:</strong> Enabled</p>
              <p>This component can read props from parent container <code>{selectedComponent.parentId || 'Root'}</code>.</p>
           </div>
        </div>
      </div>
    </div>
  );
};