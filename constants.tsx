import { 
  Box, 
  Type, 
  MousePointerClick, 
  LayoutTemplate, 
  BarChart3, 
  Table, 
  Cpu, 
  Layers 
} from 'lucide-react';
import { ComponentDefinition } from './types';

// Registry of all available components in the platform
export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  Container: {
    type: 'Container',
    label: 'Layout Container',
    category: 'Basic',
    icon: LayoutTemplate,
    isContainer: true,
    defaultProps: {
      padding: 'p-4',
      background: '#ffffff',
      borderColor: '#e2e8f0',
      borderWidth: '1px',
      layout: 'flex-col',
    },
    propSchema: {
      padding: { label: 'Padding', type: 'select', options: ['p-0', 'p-2', 'p-4', 'p-8'] },
      background: { label: 'Background Color', type: 'color' },
      borderColor: { label: 'Border Color', type: 'color' },
      borderWidth: { label: 'Border Width', type: 'select', options: ['0px', '1px', '2px', '4px'] },
      layout: { label: 'Direction', type: 'select', options: ['flex-row', 'flex-col'] },
    }
  },
  Button: {
    type: 'Button',
    label: 'Action Button',
    category: 'Basic',
    icon: MousePointerClick,
    defaultProps: {
      text: 'Click Me',
      variant: 'blue',
      size: 'md',
      onClickEvent: 'none'
    },
    propSchema: {
      text: { label: 'Button Text', type: 'text' },
      variant: { label: 'Color Variant', type: 'select', options: ['blue', 'gray', 'red', 'green'] },
      size: { label: 'Size', type: 'select', options: ['sm', 'md', 'lg'] },
      onClickEvent: { label: 'On Click', type: 'event', options: ['none', 'submitForm', 'openModal', 'refreshData'] }
    }
  },
  Tag: {
    type: 'Tag',
    label: 'Status Tag',
    category: 'Basic',
    icon: Type,
    defaultProps: {
      label: 'Active',
      color: 'green'
    },
    propSchema: {
      label: { label: 'Tag Label', type: 'text' },
      color: { label: 'Color Theme', type: 'select', options: ['green', 'blue', 'yellow', 'red', 'purple'] }
    }
  },
  MetricCard: {
    type: 'MetricCard',
    label: 'Metric Card',
    category: 'Data',
    icon: Box,
    defaultProps: {
      title: 'Total Revenue',
      value: '$45,231',
      trend: '+12%',
      trendColor: 'green'
    },
    propSchema: {
      title: { label: 'Metric Title', type: 'text' },
      value: { label: 'Display Value', type: 'text' },
      trend: { label: 'Trend Label', type: 'text' },
      trendColor: { label: 'Trend Color', type: 'select', options: ['green', 'red', 'gray'] }
    }
  },
  DataTable: {
    type: 'DataTable',
    label: 'Data Table',
    category: 'Data',
    icon: Table,
    defaultProps: {
      apiEndpoint: '/api/users/list',
      rowsPerPage: 5,
      columns: '[{"key": "id", "title": "ID"}, {"key": "name", "title": "Name"}]'
    },
    propSchema: {
      apiEndpoint: { label: 'Data Source API', type: 'api' },
      rowsPerPage: { label: 'Rows Per Page', type: 'number' },
      columns: { label: 'Columns JSON', type: 'json' }
    }
  },
  Chart: {
    type: 'Chart',
    label: 'Analytics Chart',
    category: 'Data',
    icon: BarChart3,
    defaultProps: {
      title: 'Monthly Traffic',
      type: 'bar',
      dataUrl: '/api/metrics/traffic'
    },
    propSchema: {
      title: { label: 'Chart Title', type: 'text' },
      type: { label: 'Chart Type', type: 'select', options: ['bar', 'line', 'area'] },
      dataUrl: { label: 'Data Source', type: 'api' }
    }
  },
  RemoteWidget: {
    type: 'RemoteWidget',
    label: 'Insight (Remote)',
    category: 'Module Federation',
    icon: Cpu,
    defaultProps: {
      moduleUrl: 'http://remote-entry.js',
      scope: 'insightApp',
      module: './Widget'
    },
    propSchema: {
      moduleUrl: { label: 'Remote Entry URL', type: 'text' },
      scope: { label: 'MF Scope', type: 'text' },
      module: { label: 'Module Name', type: 'text' }
    }
  }
};
