
import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Loader2, Cpu, LayoutTemplate, Box, Type, MousePointerClick, Table, BarChart3, MessageSquare, ToggleRight, AlertCircle } from 'lucide-react';
import { Button, Tag, Popover, Switch, Card, message } from 'antd';
import { useAtom, useSetAtom } from 'jotai';
import { runtimeVariablesAtom } from '../../../infrastructure/state/atoms';

// --- Registry Interface ---
export const COMPONENT_IMPLEMENTATIONS: Record<string, React.FC<any>> = {};

const register = (type: string, component: React.FC<any>) => {
  COMPONENT_IMPLEMENTATIONS[type] = component;
};

// --- Helper: Variable Interpolation ---

// Helper to safely access nested properties (e.g., "user.address.city")
const getNestedValue = (obj: any, path: string) => {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
};

const resolveTemplate = (template: string, variables: Record<string, any>) => {
  if (!template) return '';
  // Match {varName} or {nested.var.name}
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
  children, padding, background, borderColor, borderWidth, layout, 
  width, height, // Add size props
  _isCanvas 
}) => {
  return (
    <div 
      className={`
        transition-all duration-200 rounded
        ${padding || 'p-4'} 
        ${layout === 'flex-row' ? 'flex flex-row space-x-2' : 'flex flex-col space-y-2'}
      `}
      style={{
         backgroundColor: background,
         borderColor: borderColor,
         borderWidth: borderWidth,
         width: width || '100%',
         height: height || 'auto',
         minHeight: _isCanvas && (!height || height === 'auto') ? '100px' : undefined
      }}
    >
      {children}
    </div>
  );
};

const ButtonRenderer: React.FC<any> = ({ 
  text, variant, size, 
  actionType, variableKey, variableValue,
  apiUrl, method, responseKey,
  _isCanvas 
}) => {
  const [variables, setVariables] = useAtom(runtimeVariablesAtom);
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
      message.success(`Set '${variableKey}' = '${variableValue}'`);
    } else if (actionType === 'alert') {
      alert(`Alert: ${variableValue || text}`);
    } else if (actionType === 'apiRequest' && apiUrl) {
       setIsLoading(true);
       try {
         // Resolve parameters in URL using current runtime variables
         const finalUrl = resolveTemplate(apiUrl, variables);
         
         const response = await fetch(finalUrl, {
           method: method || 'GET',
           headers: { 'Content-Type': 'application/json' }
         });
         
         if (!response.ok) throw new Error(`HTTP ${response.status}`);
         
         const data = await response.json();
         
         message.success('API Request Successful');
         
         if (responseKey) {
           // Save response to variables to trigger other components
           setVariables(prev => ({ ...prev, [responseKey]: data }));
           console.log('Updated Variables:', { ...variables, [responseKey]: data });
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

const TagRenderer: React.FC<any> = ({ label, color }) => {
  // Allow label to be interpolated
  const resolvedLabel = useInterpolatedString(label);
  
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-800 border-green-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    red: "bg-red-100 text-red-800 border-red-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.blue}`}>
      {resolvedLabel}
    </span>
  );
};

const MetricCardRenderer: React.FC<any> = ({ title, value, trend, trendColor }) => {
  const resolvedValue = useInterpolatedString(value);
  const resolvedTrend = useInterpolatedString(trend);
  
  const trendColors: Record<string, string> = {
    green: "text-green-600",
    red: "text-red-600",
    gray: "text-gray-500",
  };
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 w-full">
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      <div className="mt-1 flex items-baseline justify-between md:block lg:flex">
        <div className="flex items-baseline text-2xl font-semibold text-gray-900">
          {resolvedValue}
        </div>
        <div className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium md:mt-2 lg:mt-0 ${trendColors[trendColor]}`}>
          {resolvedTrend}
        </div>
      </div>
    </div>
  );
};

const DataTableRenderer: React.FC<any> = ({ apiEndpoint, columns, rowsPerPage, _isCanvas }) => {
  const resolvedApi = useInterpolatedString(apiEndpoint);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Determine filter from resolved string for simulation
    const urlParams = new URLSearchParams(resolvedApi.split('?')[1]);
    const statusFilter = urlParams.get('status');

    setLoading(true);
    const timer = setTimeout(() => {
      let mockData = [
        { id: 1, name: 'Alice Johnson', role: 'Admin', status: 'Active' },
        { id: 2, name: 'Bob Smith', role: 'Editor', status: 'Inactive' },
        { id: 3, name: 'Charlie Brown', role: 'Viewer', status: 'Active' },
        { id: 4, name: 'David Wilson', role: 'Editor', status: 'Pending' },
        { id: 5, name: 'Eve Davis', role: 'Viewer', status: 'Active' },
        { id: 6, name: 'Frank Miller', role: 'Admin', status: 'Inactive' },
      ];

      if (statusFilter && statusFilter !== '{status}' && statusFilter !== 'undefined') {
        mockData = mockData.filter(d => d.status.toLowerCase() === statusFilter.toLowerCase());
      }

      setData(mockData);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [resolvedApi]);

  let parsedCols = [];
  try {
    parsedCols = JSON.parse(columns);
  } catch (e) {
    parsedCols = [{ key: 'error', title: 'Invalid Column JSON' }];
  }

  return (
    <div className="w-full overflow-hidden border border-gray-200 rounded-lg bg-white relative">
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" />
        </div>
      )}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <span className="text-xs font-mono text-gray-500 truncate max-w-[200px]" title={resolvedApi}>
           API: {resolvedApi}
        </span>
        <span className="text-xs text-gray-400">
          {data.length} records found
        </span>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {parsedCols.map((col: any, idx: number) => (
              <th key={idx} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr><td colSpan={parsedCols.length} className="px-6 py-4 text-center text-sm text-gray-500">No data found</td></tr>
          ) : (
            data.slice(0, rowsPerPage).map((row: any, idx) => (
              <tr key={idx}>
                {parsedCols.map((col: any, cIdx: number) => (
                  <td key={cIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[col.key] || '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const ChartRenderer: React.FC<any> = ({ title, type, dataUrl, _isCanvas }) => {
  const resolvedUrl = useInterpolatedString(dataUrl);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Determine filter from resolved string for simulation
    const urlParams = new URLSearchParams(resolvedUrl.split('?')[1]);
    const period = urlParams.get('period') || 'monthly';

    setLoading(true);
    const timer = setTimeout(() => {
      let mockData = [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 300 },
        { name: 'Mar', value: 600 },
        { name: 'Apr', value: 800 },
        { name: 'May', value: 500 },
      ];
      
      if (period === 'weekly') {
         mockData = [
            { name: 'W1', value: 120 }, { name: 'W2', value: 200 }, { name: 'W3', value: 150 }, { name: 'W4', value: 280 }
         ];
      } else if (period === 'yearly') {
         mockData = [
            { name: '2021', value: 2400 }, { name: '2022', value: 1300 }, { name: '2023', value: 9800 }
         ];
      }

      setData(mockData);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [resolvedUrl]);

  const ChartComponent = type === 'line' ? LineChart : type === 'area' ? AreaChart : BarChart;
  const DataComponent = type === 'line' ? Line : type === 'area' ? Area : Bar;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 w-full h-64 flex flex-col relative">
       {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
          <Loader2 className="animate-spin text-blue-500" />
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-mono">Src: {resolvedUrl}</span>
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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [moduleUrl]);

  if (loading) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-purple-50 border border-purple-100 rounded-lg text-purple-600 animate-pulse">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm font-medium">Loading Remote Module...</span>
      </div>
    );
  }
  return (
    <div className="w-full h-auto p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4" />
          <span className="font-bold text-sm">Remote Insight</span>
        </div>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white/90">v1.2.0</span>
      </div>
      <p className="text-sm text-white/90">
        This component is loaded via Module Federation from:
      </p>
      <code className="block mt-2 text-xs bg-black/20 p-2 rounded truncate">
        {scope} @ {moduleUrl}
      </code>
    </div>
  );
};

// --- Ant Design Components ---

const AntdButtonRenderer: React.FC<any> = ({ 
  text, type, danger, ghost, 
  actionType, variableKey, variableValue, 
  apiUrl, method, responseKey,
  _isCanvas 
}) => {
  const [variables, setVariables] = useAtom(runtimeVariablesAtom);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (_isCanvas) return;
    
    if (actionType === 'setVariable' && variableKey) {
       setVariables(prev => ({ ...prev, [variableKey]: variableValue }));
       message.success(`Set ${variableKey} = ${variableValue}`);
    } else if (actionType === 'alert') {
       message.info(variableValue || text);
    } else if (actionType === 'apiRequest' && apiUrl) {
      setIsLoading(true);
      try {
        const finalUrl = resolveTemplate(apiUrl, variables);
        const response = await fetch(finalUrl, {
          method: method || 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        
        message.success('Request sent');
        if (responseKey) {
          setVariables(prev => ({ ...prev, [responseKey]: data }));
        }
      } catch (e) {
        message.error('Request failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Button 
      type={type} 
      danger={danger} 
      ghost={ghost} 
      onClick={handleClick}
      loading={isLoading}
    >
      {text}
    </Button>
  );
};

const AntdTagRenderer: React.FC<any> = ({ label, color, bordered }) => {
  // Allow label interpolation for Antd Tag too
  const resolvedLabel = useInterpolatedString(label);
  return <Tag color={color} bordered={bordered}>{resolvedLabel}</Tag>;
};

// --- Interactive Components ---

const PopoverContainerRenderer: React.FC<any> = ({ children, title, trigger, placement, _isCanvas }) => {
  const childrenArray = React.Children.toArray(children);
  const triggerNode = childrenArray[0] || <div className="p-2 border border-dashed border-gray-300 text-gray-400 text-xs text-center rounded">Drop Trigger</div>;
  const contentNode = childrenArray.slice(1);
  
  if (_isCanvas) {
    // In Canvas mode, show structured layout to allow editing both
    return (
      <div className="border border-blue-200 bg-blue-50/50 rounded p-2">
        <div className="mb-2 text-[10px] font-bold text-blue-500 uppercase">Popover Trigger Area</div>
        <div className="mb-4">{triggerNode}</div>
        
        <div className="border-t border-blue-200 pt-2 relative">
          <div className="mb-2 text-[10px] font-bold text-blue-500 uppercase">Popover Content Area</div>
          <div className="min-h-[60px] bg-white rounded border border-gray-200 p-2">
             {contentNode.length === 0 ? <span className="text-xs text-gray-400 italic">Drop content here</span> : contentNode}
          </div>
        </div>
      </div>
    );
  }

  // In Preview/Production mode, interact properly
  return (
    <Popover 
      content={<div className="min-w-[200px]">{contentNode}</div>} 
      title={title} 
      trigger={trigger} 
      placement={placement}
    >
      <span className="inline-block cursor-pointer">{triggerNode}</span>
    </Popover>
  );
};

// --- Register All ---

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

// --- Preview Helper ---

export const ComponentPreview: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'Button': return <div className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium w-max">Click Me</div>;
    case 'Tag': return <div className="px-2 py-0.5 bg-green-100 text-green-800 border border-green-200 rounded-full text-[10px] w-max">Active</div>;
    case 'Container': return <div className="w-24 h-16 border-2 border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center"><LayoutTemplate size={16} className="text-gray-400"/></div>;
    case 'MetricCard': return <div className="w-28 p-2 bg-white border border-gray-200 rounded shadow-sm"><div className="h-2 w-10 bg-gray-200 rounded mb-1"></div><div className="h-4 w-16 bg-gray-300 rounded"></div></div>;
    case 'DataTable': return <div className="w-28 border border-gray-200 rounded bg-white overflow-hidden"><div className="h-3 bg-gray-100 border-b border-gray-200"></div><div className="space-y-1 p-1"><div className="h-1.5 w-full bg-gray-100 rounded"></div><div className="h-1.5 w-full bg-gray-100 rounded"></div></div></div>;
    case 'Chart': return <div className="w-28 h-20 border border-gray-200 rounded bg-white p-1 flex items-end space-x-0.5"><div className="h-3/4 w-1/4 bg-blue-400 rounded-t"></div><div className="h-1/2 w-1/4 bg-blue-400 rounded-t"></div><div className="h-full w-1/4 bg-blue-400 rounded-t"></div><div className="h-2/3 w-1/4 bg-blue-400 rounded-t"></div></div>;
    case 'RemoteWidget': return <div className="w-28 h-16 bg-purple-100 border border-purple-300 rounded flex flex-col items-center justify-center text-purple-600"><Cpu size={16} /><span className="text-[8px] mt-1 font-bold">REMOTE</span></div>;
    
    // Antd Previews
    case 'AntdButton': return <Button type="primary" size="small">AntD Btn</Button>;
    case 'AntdTag': return <Tag color="blue">AntD Tag</Tag>;
    case 'Popover': return <div className="w-28 h-16 border border-blue-200 bg-blue-50 rounded flex flex-col items-center justify-center text-blue-500"><MessageSquare size={16} /><span className="text-[8px] mt-1">POPOVER</span></div>;
    
    default: return <div className="text-[10px] text-gray-400">Unknown</div>;
  }
};
