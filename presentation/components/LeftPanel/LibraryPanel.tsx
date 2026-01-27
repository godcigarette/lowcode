
import React, { useState, useRef } from 'react';
import { ComponentType } from '../../../domain/Component';
import { ComponentRegistryService } from '../../../application/services/ComponentRegistryService';
import { ComponentPreview } from '../Renderer/RendererComponents';

export const LibraryPanel: React.FC = () => {
  const categories = ['Basic', 'Data', 'Ant Design', 'Interactive', 'Module Federation'];
  const [hoveredComp, setHoveredComp] = useState<{ type: ComponentType; y: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/react-dnd-component', type);
    e.dataTransfer.effectAllowed = 'copy';
    setHoveredComp(null);
  };

  const components = ComponentRegistryService.getAll();

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
              {components
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
             {ComponentRegistryService.get(hoveredComp.type).category} Component
           </div>
        </div>
      )}
    </div>
  );
};
