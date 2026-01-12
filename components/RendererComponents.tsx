import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { ComponentInstance, ComponentType } from '../types';
import { Loader2, AlertCircle, Cpu, LayoutTemplate, MousePointerClick, Type, Box, Table, BarChart3 } from 'lucide-react';

// --- Basic UI Components ---

export const ButtonRenderer: React.FC<any> = ({ text, variant, size, onClick }) => {
  const baseStyle = "font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1";
  
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

  return (
    <button className={`${baseStyle} ${variants[variant] || variants.blue} ${sizes[size] || sizes.md}`} onClick={onClick}>
      {text}
    </button>
  );
};

export const TagRenderer: React.FC<any> = ({ label, color }) => {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-800 border-green-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    red: "bg-red-100 text-red-800 border-red-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.blue}`}>
      {label}
    </span>
  );
};

// --- Data Components ---

export const MetricCardRenderer: React.FC<any> = ({ title, value, trend, trendColor }) => {
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
          {value}
        </div>
        <div className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium md:mt-2 lg:mt-0 ${trendColors[trendColor]}`}>
          {trend}
        </div>
      </div>
    </div>
  );
};

export const DataTableRenderer: React.FC<any> = ({ apiEndpoint, columns, rowsPerPage }) => {
  // Mock data since we don't have a real backend
  const mockData = [
    { id: 1, name: 'Alice Johnson', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Bob Smith', role: 'Editor', status: 'Inactive' },
    { id: 3, name: 'Charlie Brown', role: 'Viewer', status: 'Active' },
    { id: 4, name: 'David Wilson', role: 'Editor', status: 'Pending' },
    { id: 5, name: 'Eve Davis', role: 'Viewer', status: 'Active' },
  ];

  let parsedCols = [];
  try {
    parsedCols = JSON.parse(columns);
  } catch (e) {
    parsedCols = [{ key: 'error', title: 'Invalid Column JSON' }];
  }

  return (
    <div className="w-full overflow-hidden border border-gray-200 rounded-lg">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <span className="text-xs font-mono text-gray-500">API: {apiEndpoint}</span>
        <span className="text-xs text-gray-400">Page 1 of 5</span>
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
          {mockData.slice(0, rowsPerPage).map((row: any, idx) => (
            <tr key={idx}>
              {parsedCols.map((col: any, cIdx: number) => (
                <td key={cIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row[col.key] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const ChartRenderer: React.FC<any> = ({ title, type }) => {
  const data = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
  ];

  const ChartComponent = type === 'line' ? LineChart : type === 'area' ? AreaChart : BarChart;
  const DataComponent = type === 'line' ? Line : type === 'area' ? Area : Bar;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 w-full h-64 flex flex-col">
      <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
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

// --- Module Federation Mock ---

export const RemoteWidgetRenderer: React.FC<any> = ({ moduleUrl, scope }) => {
  const [loading, setLoading] = useState(true);
  
  // Simulate loading a remote module
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
      <div className="mt-3 flex space-x-2">
        <div className="h-2 w-1/3 bg-white/30 rounded"></div>
        <div className="h-2 w-2/3 bg-white/30 rounded"></div>
      </div>
    </div>
  );
};

// --- Component Preview (New) ---

export const ComponentPreview: React.FC<{ type: ComponentType }> = ({ type }) => {
  switch (type) {
    case 'Button':
      return <div className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium w-max">Click Me</div>;
    case 'Tag':
      return <div className="px-2 py-0.5 bg-green-100 text-green-800 border border-green-200 rounded-full text-[10px] w-max">Active</div>;
    case 'Container':
      return <div className="w-24 h-16 border-2 border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center"><LayoutTemplate size={16} className="text-gray-400"/></div>;
    case 'MetricCard':
      return <div className="w-28 p-2 bg-white border border-gray-200 rounded shadow-sm"><div className="h-2 w-10 bg-gray-200 rounded mb-1"></div><div className="h-4 w-16 bg-gray-300 rounded"></div></div>;
    case 'DataTable':
      return <div className="w-28 border border-gray-200 rounded bg-white overflow-hidden"><div className="h-3 bg-gray-100 border-b border-gray-200"></div><div className="space-y-1 p-1"><div className="h-1.5 w-full bg-gray-100 rounded"></div><div className="h-1.5 w-full bg-gray-100 rounded"></div></div></div>;
    case 'Chart':
      return <div className="w-28 h-20 border border-gray-200 rounded bg-white p-1 flex items-end space-x-0.5"><div className="h-3/4 w-1/4 bg-blue-400 rounded-t"></div><div className="h-1/2 w-1/4 bg-blue-400 rounded-t"></div><div className="h-full w-1/4 bg-blue-400 rounded-t"></div><div className="h-2/3 w-1/4 bg-blue-400 rounded-t"></div></div>;
    case 'RemoteWidget':
      return <div className="w-28 h-16 bg-purple-100 border border-purple-300 rounded flex flex-col items-center justify-center text-purple-600"><Cpu size={16} /><span className="text-[8px] mt-1 font-bold">REMOTE</span></div>;
    default:
      return null;
  }
};
