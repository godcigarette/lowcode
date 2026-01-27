
import { 
  Box, 
  Type, 
  MousePointerClick, 
  LayoutTemplate, 
  BarChart3, 
  Table, 
  Cpu,
  ToggleRight,
  MessageSquare
} from 'lucide-react';
import { ComponentDefinition } from '../../domain/Component';

export class ComponentRegistryService {
  private static registry: Record<string, ComponentDefinition> = {
    // --- Basic ---
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
        width: '100%',
        height: 'auto',
      },
      propSchema: {
        width: { label: 'Width', type: 'text', description: 'e.g., 100%, 300px' },
        height: { label: 'Height', type: 'text', description: 'e.g., auto, 200px' },
        layout: { label: 'Direction', type: 'select', options: ['flex-row', 'flex-col'] },
        padding: { label: 'Padding', type: 'select', options: ['p-0', 'p-2', 'p-4', 'p-8'] },
        background: { label: 'Background Color', type: 'color' },
        borderColor: { label: 'Border Color', type: 'color' },
        borderWidth: { label: 'Border Width', type: 'select', options: ['0px', '1px', '2px', '4px'] },
      }
    },
    Button: {
      type: 'Button',
      label: 'Action Button',
      category: 'Basic',
      icon: MousePointerClick,
      defaultProps: {
        text: 'Get User Info',
        variant: 'blue',
        size: 'md',
        actionType: 'apiRequest',
        variableKey: '',
        variableValue: '',
        apiUrl: 'https://jsonplaceholder.typicode.com/users/1',
        method: 'GET',
        responseKey: 'userData'
      },
      propSchema: {
        text: { label: 'Button Text', type: 'text' },
        variant: { label: 'Color Variant', type: 'select', options: ['blue', 'gray', 'red', 'green'] },
        size: { label: 'Size', type: 'select', options: ['sm', 'md', 'lg'] },
        actionType: { label: 'Interaction', type: 'select', options: ['none', 'setVariable', 'apiRequest', 'alert'], description: 'Action on click' },
        // Set Variable Props
        variableKey: { label: 'Set Var Name', type: 'text', description: 'For "Set Variable" action' },
        variableValue: { label: 'Set Var Value', type: 'text' },
        // API Request Props
        apiUrl: { label: 'API URL', type: 'api', description: 'Supports {variable} interpolation' },
        method: { label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] },
        responseKey: { label: 'Save Response To', type: 'text', description: 'Variable name to save JSON result' }
      }
    },
    Tag: {
      type: 'Tag',
      label: 'Status Tag',
      category: 'Basic',
      icon: Type,
      defaultProps: {
        label: 'User: {userData.name}',
        color: 'blue'
      },
      propSchema: {
        label: { label: 'Tag Label', type: 'text', description: 'Supports {userData.name}' },
        color: { label: 'Color Theme', type: 'select', options: ['green', 'blue', 'yellow', 'red', 'purple'] }
      }
    },

    // --- Data ---
    MetricCard: {
      type: 'MetricCard',
      label: 'Metric Card',
      category: 'Data',
      icon: Box,
      defaultProps: {
        title: 'User Email',
        value: '{userData.email}',
        trend: 'ID: {userData.id}',
        trendColor: 'gray'
      },
      propSchema: {
        title: { label: 'Metric Title', type: 'text' },
        value: { label: 'Display Value', type: 'text', description: 'Supports {variable.path}' },
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
        apiEndpoint: '/api/users/list?status={status}',
        rowsPerPage: 5,
        columns: '[{"key": "id", "title": "ID"}, {"key": "name", "title": "Name"}, {"key": "status", "title": "Status"}]'
      },
      propSchema: {
        apiEndpoint: { label: 'Data Source API', type: 'api', description: 'Use {variable} to inject dynamic values' },
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
        dataUrl: '/api/metrics/traffic?period={period}'
      },
      propSchema: {
        title: { label: 'Chart Title', type: 'text' },
        type: { label: 'Chart Type', type: 'select', options: ['bar', 'line', 'area'] },
        dataUrl: { label: 'Data Source', type: 'api', description: 'Supports {period} injection' }
      }
    },

    // --- Module Federation ---
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
    },

    // --- Ant Design ---
    AntdButton: {
      type: 'AntdButton',
      label: 'AntD Button',
      category: 'Ant Design',
      icon: MousePointerClick,
      defaultProps: {
        text: 'AntD Fetch',
        type: 'primary',
        danger: false,
        ghost: false,
        actionType: 'apiRequest',
        variableKey: '',
        variableValue: '',
        apiUrl: 'https://jsonplaceholder.typicode.com/todos/1',
        method: 'GET',
        responseKey: 'todoItem'
      },
      propSchema: {
        text: { label: 'Text', type: 'text' },
        type: { label: 'Type', type: 'select', options: ['primary', 'default', 'dashed', 'text', 'link'] },
        danger: { label: 'Danger', type: 'boolean' },
        ghost: { label: 'Ghost', type: 'boolean' },
        actionType: { label: 'Interaction', type: 'select', options: ['none', 'setVariable', 'apiRequest', 'alert'] },
        variableKey: { label: 'Set Var Name', type: 'text' },
        variableValue: { label: 'Set Var Value', type: 'text' },
        apiUrl: { label: 'API URL', type: 'api' },
        method: { label: 'Method', type: 'select', options: ['GET', 'POST'] },
        responseKey: { label: 'Save Result To', type: 'text' }
      }
    },
    AntdTag: {
      type: 'AntdTag',
      label: 'AntD Tag',
      category: 'Ant Design',
      icon: Type,
      defaultProps: {
        label: 'Processing',
        color: 'blue',
        bordered: true
      },
      propSchema: {
        label: { label: 'Label', type: 'text' },
        color: { label: 'Color', type: 'select', options: ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'] },
        bordered: { label: 'Bordered', type: 'boolean' }
      }
    },

    // --- Interactive ---
    Popover: {
      type: 'Popover',
      label: 'Interaction Popover',
      category: 'Interactive',
      icon: MessageSquare,
      isContainer: true, // It acts as a container for interactions
      defaultProps: {
        title: 'Details',
        trigger: 'hover',
        placement: 'top'
      },
      propSchema: {
        title: { label: 'Title', type: 'text' },
        trigger: { label: 'Trigger', type: 'select', options: ['hover', 'click', 'focus'] },
        placement: { label: 'Placement', type: 'select', options: ['top', 'left', 'right', 'bottom'] }
      }
    }
  };

  static getAll(): ComponentDefinition[] {
    return Object.values(this.registry);
  }

  static get(type: string): ComponentDefinition {
    return this.registry[type];
  }
}
