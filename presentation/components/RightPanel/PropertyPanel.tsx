
import React, { useState, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { PropSchema } from '../../../domain/Configurable';
import { ComponentRegistryService } from '../../../application/services/ComponentRegistryService';
import { Settings, Loader2 } from 'lucide-react';
import { selectedComponentAtom, updateComponentAtom, fetchRemoteSchemaAtom } from '../../../infrastructure/state/atoms';

export const PropertyPanel: React.FC = () => {
  const [selectedComponent] = useAtom(selectedComponentAtom);
  const updateComponent = useSetAtom(updateComponentAtom);
  const fetchRemoteSchema = useSetAtom(fetchRemoteSchemaAtom);
  const [loadingSchema, setLoadingSchema] = useState(false);

  // Effect to simulate fetching remote schema when moduleUrl changes
  useEffect(() => {
    if (!selectedComponent || selectedComponent.type !== 'RemoteWidget') return;
    
    const moduleUrl = selectedComponent.props.moduleUrl;
    
    // Using an async wrapper inside useEffect
    const load = async () => {
        setLoadingSchema(true);
        await fetchRemoteSchema({ id: selectedComponent.id, moduleUrl });
        setLoadingSchema(false);
    };

    const timer = setTimeout(load, 1000);
    return () => clearTimeout(timer);
  }, [selectedComponent?.props?.moduleUrl, selectedComponent?.id]);


  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
         <Settings size={48} className="mb-4 opacity-20" />
         <p className="text-sm">Select a component on the canvas to configure its properties, API, and events.</p>
      </div>
    );
  }

  const def = ComponentRegistryService.get(selectedComponent.type);
  const schema = { ...def.propSchema, ...(selectedComponent.dynamicSchema || {}) };

  const handleChange = (key: string, value: any) => {
    updateComponent({
      id: selectedComponent.id,
      updates: {
        props: {
          ...selectedComponent.props,
          [key]: value
        }
      }
    });
  };

  // Helper to determine if a field should be shown based on component state
  const shouldShowField = (key: string) => {
    if (selectedComponent.type === 'Button' || selectedComponent.type === 'AntdButton') {
      const actionType = selectedComponent.props.actionType;
      
      // Fields specific to API Requests
      if (['apiUrl', 'method', 'responseKey'].includes(key)) {
        return actionType === 'apiRequest';
      }
      
      // Fields specific to Setting Variables
      if (['variableKey', 'variableValue'].includes(key)) {
        return actionType === 'setVariable';
      }

      // Fields specific to Component Control
      if (['targetId', 'targetProp', 'targetValue'].includes(key)) {
        return actionType === 'controlComponent';
      }
    }
    
    if (selectedComponent.type === 'DataTable') {
      const sourceType = selectedComponent.props.dataSourceType;
      
      if (key === 'apiEndpoint') {
        return sourceType !== 'variable';
      }
      
      if (key === 'dataVariable') {
        return sourceType === 'variable';
      }
    }

    return true;
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

        {(Object.entries(schema) as [string, PropSchema][]).map(([key, field]) => {
          if (!shouldShowField(key)) return null;

          return (
            <div key={key} className="space-y-1 animate-in fade-in duration-300">
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
                    HTTP
                  </span>
                  <input
                    type="text"
                    value={selectedComponent.props[key] || ''}
                    onChange={e => handleChange(key, e.target.value)}
                    placeholder="https://api.example.com"
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                  />
                </div>
              )}
            </div>
          );
        })}
        
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
