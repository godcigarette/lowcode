
import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Loader2, Cpu, LayoutTemplate, Box, Type, MousePointerClick, Table, BarChart3, MessageSquare, ToggleRight, AlertCircle, Database } from 'lucide-react';
import { Button, Tag, Popover, Switch, Card, message } from 'antd';
import { useAtom, useSetAtom } from 'jotai';
import { runtimeVariablesAtom, updateComponentAtom, treeAtom } from '../../../infrastructure/state/atoms';
import { CanvasLayout } from '../../../domain/CanvasLayout';

// --- Registry Interface ---
export const COMPONENT_IMPLEMENTATIONS: Record<string, React.FC<any>> = {};

const register = (type: string, component: React.FC<any>) => {
  COMPONENT_IMPLEMENTATIONS[type] = component;
};

// --- Helper: Variable Interpolation ---
const getNestedValue = (obj: any, path: string) => {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
};

const resolveTemplate = (template: string, variables: Record<string, any>) => {
  if (!template) return '';
  return template.replace(/\{([\w\.]+)\}/g, (_, key) => {
    const val = getNestedValue(variables, key);
    return val !== undefined ? String(val) : '';
  });
};

const useInterpolatedString = (template: string) => {
  const [variables] = useAtom(runtimeVariablesAtom);
  return useMemo(() => {
    if (!template) return '';
    return template.replace(/\{([\w\.]+)\}/g, (_, key) => {
      const val = getNestedValue(variables, key);
      return val !== undefined ? String(val) : `{${key}}`;
    });
  }, [template, variables]);
};

// --- Standard Renderers ---

const ContainerRenderer: React.FC<any> = ({ 
  children, padding, background, borderColor, borderWidth, 
  width, height, visible = true,
  // Layout Props
  layoutMode = 'flex',
  flexDirection = 'column',
  flexWrap = 'nowrap',
  justifyContent = 'start',
  alignItems = 'stretch',
  gap = 16,
  columnCount = 3,
  _isCanvas 
}) => {
  
  if (!visible && !_isCanvas) return null;

  const containerStyle: React.CSSProperties = {
    backgroundColor: background,
    borderColor: borderColor,
    borderWidth: borderWidth,
    width: width || '100%',
    height: height || 'auto',
    minHeight: _isCanvas && (!height || height === 'auto') ? '100px' : undefined,
    padding: padding === 'p-0' ? '0px' : padding === 'p-2' ? '0.5rem' : padding === 'p-8' ? '2rem' : '1rem',
    borderStyle: borderWidth && borderWidth.includes('dashed') ? 'dashed' : 'solid',
    opacity: !visible && _isCanvas ? 0.5 : 1, // Dim if hidden in canvas
  };

  if (layoutMode === 'flex') {
    containerStyle.display = 'flex';
    containerStyle.flexDirection = flexDirection;
    containerStyle.flexWrap = flexWrap;
    containerStyle.justifyContent = justifyContent;
    containerStyle.alignItems = alignItems;
    containerStyle.gap = `${gap}px`;
  } else if (layoutMode === 'grid') {
    containerStyle.display = 'grid';
    containerStyle.gridTemplateColumns = `repeat(auto-fill, minmax(${Math.floor(100/Math.max(1, columnCount))}%, 1fr))`;
    containerStyle.gap = `${gap}px`;
  } else if (layoutMode === 'masonry') {
    containerStyle.columnCount = columnCount;
    containerStyle.columnGap = `${gap}px`;
  }

  return (
    <div 
      className={`transition-all duration-200 rounded ${layoutMode === 'masonry' ? 'block' : ''} ${!visible && _isCanvas ? 'border-dashed border-gray-400' : ''}`}
      style={containerStyle}
    >
      {layoutMode === 'masonry' 
        ? React.Children.map(children, child => (
            <div style={{ breakInside: 'avoid', marginBottom: `${gap}px` }}>{child}</div>
          ))
        : children
      }
      {!visible && _isCanvas && (
        <div className="absolute top-2 right-2 text-xs bg-gray-200 px-1 rounded text-gray-500 pointer-events-none">Hidden</div>
      )}
    </div>
  );
};

const ButtonRenderer: React.FC<any> = ({ 
  text, variant, size, 
  actionType, variableKey, variableValue,
  apiUrl, method, responseKey,
  targetId, targetProp, targetValue,
  _isCanvas 
}) => {
  const [variables, setVariables] = useAtom(runtimeVariablesAtom);
  const [tree] = useAtom(treeAtom);
  const updateComponent = useSetAtom(updateComponentAtom);
  const [isLoading, setIsLoading] = useState(false);
  
  const baseStyle = "font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center justify-center space-x-2";
  const variants: Record<string, string> = {
    blue: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    gray: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
    red: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    green: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500",
  };
  const sizes: Record<string, string> = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const handleClick = async (e: React.MouseEvent) => {
    if (_isCanvas) return; 

    if (actionType === 'setVariable' && variableKey) {
      setVariables(prev => ({ ...prev, [variableKey]: variableValue }));
      message.success(`Variable Set: ${variableKey}`);
    
    } else if (actionType === 'controlComponent' && targetId && targetProp) {
        // --- Control Component Logic ---
        const targetNode = CanvasLayout.findNode(tree, targetId);
        if (targetNode) {
          let newValue: any = targetValue;
          
          // Type casting for simple values
          if (targetValue === 'true') newValue = true;
          else if (targetValue === 'false') newValue = false;
          else if (!isNaN(Number(targetValue)) && targetValue.trim() !== '') newValue = Number(targetValue);

          updateComponent({
            id: targetId,
            updates: {
              props: {
                ...targetNode.props,
                [targetProp]: newValue
              }
            }
          });
          message.info(`Updated ${targetProp} of ${targetId}`);
        } else {
          message.warning(`Target component ${targetId} not found`);
        }

    } else if (actionType === 'alert') {
      alert(`Alert: ${variableValue || text}`);
    } else if (actionType === 'apiRequest' && apiUrl) {
       setIsLoading(true);
       try {
         const finalUrl = resolveTemplate(apiUrl, variables);
         const response = await fetch(finalUrl, {
           method: method || 'GET',
           headers: { 'Content-Type': 'application/json' }
         });
         
         if (!response.ok) throw new Error(`HTTP ${response.status}`);
         const data = await response.json();
         message.success(`API Success`);
         
         if (responseKey) {
           setVariables(prev => ({ ...prev, [responseKey]: data }));
         }
       } catch (err) {
         console.error(err);
         message.error('API Request Failed');
       } finally {
         setIsLoading(false);
       }
    }
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant] || variants.blue} ${sizes[size] || sizes.md} active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed`} 
      onClick={handleClick}
      disabled={isLoading}
      type="button"
    >
      {isLoading && <Loader2 size={14} className="animate-spin" />}
      <span>{text}</span>
    </button>
  );
};

const TagRenderer: React.FC<any> = ({ label, color, visible = true, _isCanvas }) => {
  if (!visible && !_isCanvas) return null;

  const resolvedLabel = useInterpolatedString(label);
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-800 border-green-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    red: "bg-red-100 text-red-800 border-red-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.blue} ${!visible ? 'opacity-50' : ''}`}>
      {resolvedLabel}
      {!visible && _isCanvas && <span className="ml-1 text-[8px] uppercase font-bold">(Hidden)</span>}
    </span>
  );
};

const MetricCardRenderer: React.FC<any> = ({ title, value, trend, trendColor, visible = true, _isCanvas }) => {
  if (!visible && !_isCanvas) return null;

  const resolvedValue = useInterpolatedString(value);
  const resolvedTrend = useInterpolatedString(trend);
  const trendColors: Record<string, string> = {
    green: "text-green-600",
    red: "text-red-600",
    gray: "text-gray-500",
  };
  
  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 w-full ${!visible ? 'opacity-50 border-dashed' : ''}`}>
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      <div className="mt-1 flex items-baseline justify-between md:block lg:flex">
        <div className="flex items-baseline text-2xl font-semibold text-gray-900">
          {resolvedValue}
        </div>
        <div className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium md:mt-2 lg:mt-0 ${trendColors[trendColor]}`}>
          {resolvedTrend}
        </div>
      </div>
      {!visible && _isCanvas && <div className="text-[10px] text-red-400 mt-1">Hidden in Preview</div>}
    </div>
  );
};

const DataTableRenderer: React.FC<any> = ({ 
  apiEndpoint, dataSourceType, dataVariable, columns, rowsPerPage, visible = true, _isCanvas 
}) => {
  if (!visible && !_isCanvas) return null;

  const [variables] = useAtom(runtimeVariablesAtom);
  const resolvedApi = useInterpolatedString(apiEndpoint);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (dataSourceType === 'variable') {
      const varData = variables[dataVariable];
      if (Array.isArray(varData)) setData(varData);
      else if (!varData) setData([]); 
      else setData([varData]); 
      setLoading(false);
    } else {
      const urlParams = new URLSearchParams(resolvedApi.split('?')[1]);
      const statusFilter = urlParams.get('status');
      setLoading(true);
      const timer = setTimeout(() => {
        let mockData = [
          { id: 1, name: 'Alice Johnson', role: 'Admin', status: 'Active', email: 'alice@example.com' },
          { id: 2, name: 'Bob Smith', role: 'Editor', status: 'Inactive', email: 'bob@example.com' },
          { id: 3, name: 'Charlie Brown', role: 'Viewer', status: 'Active', email: 'charlie@example.com' },
          { id: 4, name: 'David Wilson', role: 'Editor', status: 'Pending', email: 'david@example.com' },
          { id: 5, name: 'Eve Davis', role: 'Viewer', status: 'Active', email: 'eve@example.com' },
          { id: 6, name: 'Frank Miller', role: 'Admin', status: 'Inactive', email: 'frank@example.com' },
        ];
        if (statusFilter && statusFilter !== '{status}' && statusFilter !== 'undefined') {
          mockData = mockData.filter(d => d.status.toLowerCase() === statusFilter.toLowerCase());
        }
        setData(mockData);
        setLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [dataSourceType, dataVariable, variables, resolvedApi]);

  let parsedCols = [];
  try { parsedCols = JSON.parse(columns); } catch (e) { parsedCols = [{ key: 'error', title: 'Invalid Column JSON' }]; }

  return (
    <div className={`w-full overflow-hidden border border-gray-200 rounded-lg bg-white relative ${!visible ? 'opacity-60 grayscale' : ''}`}>
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" />
        </div>
      )}
      {!visible && _isCanvas && <div className="absolute top-0 right-0 bg-red-100 text-red-800 text-[10px] px-2 py-1 z-20">Hidden</div>}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-xs text-gray-500 truncate max-w-[200px]">
           {dataSourceType === 'variable' ? (
              <><Database size={12} className="text-purple-500" /> <span className="font-mono">Var: {dataVariable}</span></>
           ) : (
              <span className="font-mono">API: {resolvedApi}</span>
           )}
        </div>
        <span className="text-xs text-gray-400">{data.length} records</span>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>{parsedCols.map((col: any, idx: number) => (<th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col.title}</th>))}</tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr><td colSpan={parsedCols.length} className="px-6 py-4 text-center text-sm text-gray-500">No data</td></tr>
          ) : (
            data.slice(0, rowsPerPage).map((row: any, idx) => (
              <tr key={idx}>{parsedCols.map((col: any, cIdx: number) => (<td key={cIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row[col.key] ?? '-'}</td>))}</tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const ChartRenderer: React.FC<any> = ({ title, type, dataUrl, visible = true, _isCanvas }) => {
  if (!visible && !_isCanvas) return null;
  const resolvedUrl = useInterpolatedString(dataUrl);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(resolvedUrl.split('?')[1]);
    const period = urlParams.get('period') || 'monthly';
    const timer = setTimeout(() => {
      let mockData = [
        { name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 600 },
        { name: 'Apr', value: 800 }, { name: 'May', value: 500 },
      ];
      if (period === 'weekly') mockData = [{ name: 'W1', value: 120 }, { name: 'W2', value: 200 }, { name: 'W3', value: 150 }];
      setData(mockData);
    }, 800);
    return () => clearTimeout(timer);
  }, [resolvedUrl]);

  const ChartComponent = type === 'line' ? LineChart : type === 'area' ? AreaChart : BarChart;
  const DataComponent = type === 'line' ? Line : type === 'area' ? Area : Bar;

  return (
    <div className={`bg-white p-4 rounded-lg border border-gray-200 w-full h-64 flex flex-col relative ${!visible ? 'opacity-50' : ''}`}>
       {!visible && _isCanvas && <div className="absolute top-2 right-2 text-red-500 font-bold text-xs z-10">Hidden</div>}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data}>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip />
            <DataComponent type="monotone" dataKey="value" fill="#3b82f6" stroke="#3b82f6" />
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const RemoteWidgetRenderer: React.FC<any> = ({ moduleUrl, scope }) => {
  return (
    <div className="w-full h-auto p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white shadow-md">
       <span className="font-bold text-sm">Remote Insight</span>
       <div className="text-xs opacity-70 mt-1">{scope}</div>
    </div>
  );
};

// --- Ant Design Components ---
const AntdButtonRenderer: React.FC<any> = ({ text, type, _isCanvas }) => {
  return <Button type={type} onClick={() => !_isCanvas && message.info('Clicked')}>{text}</Button>;
};

const AntdTagRenderer: React.FC<any> = ({ label, color, bordered }) => {
  const resolvedLabel = useInterpolatedString(label);
  return <Tag color={color} bordered={bordered}>{resolvedLabel}</Tag>;
};

// --- Interactive Components ---
const PopoverContainerRenderer: React.FC<any> = ({ children, title, trigger, placement, _isCanvas }) => {
  const childrenArray = React.Children.toArray(children);
  const triggerNode = childrenArray[0] || <div className="p-2 border border-dashed text-gray-400 text-xs">Trigger</div>;
  const contentNode = childrenArray.slice(1);
  
  if (_isCanvas) {
    return (
      <div className="border border-blue-200 bg-blue-50/50 rounded p-2">
        <div className="mb-2 text-[10px] text-blue-500 uppercase">Trigger</div>
        <div className="mb-4">{triggerNode}</div>
        <div className="border-t border-blue-200 pt-2">
          <div className="mb-2 text-[10px] text-blue-500 uppercase">Content</div>
          <div className="min-h-[60px] bg-white rounded p-2">{contentNode}</div>
        </div>
      </div>
    );
  }
  return (
    <Popover content={<div className="min-w-[200px]">{contentNode}</div>} title={title} trigger={trigger} placement={placement}>
      <span className="inline-block cursor-pointer">{triggerNode}</span>
    </Popover>
  );
};

register('Container', ContainerRenderer);
register('Button', ButtonRenderer);
register('Tag', TagRenderer);
register('MetricCard', MetricCardRenderer);
register('DataTable', DataTableRenderer);
register('Chart', ChartRenderer);
register('RemoteWidget', RemoteWidgetRenderer);
register('AntdButton', AntdButtonRenderer);
register('AntdTag', AntdTagRenderer);
register('Popover', PopoverContainerRenderer);

export const ComponentPreview: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'Button': return <div className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs">Button</div>;
    case 'Tag': return <div className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px]">Tag</div>;
    case 'Container': return <div className="w-16 h-10 border-dashed border-2 border-gray-300 rounded flex items-center justify-center"><LayoutTemplate size={14}/></div>;
    default: return <div className="text-[10px] text-gray-400">{type}</div>;
  }
};
