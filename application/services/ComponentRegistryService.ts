
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
        width: '100%',
        height: 'auto',
        padding: 'p-4',
        background: 'transparent',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        visible: true,
        // Layout Config
        layoutMode: 'flex', 
        flexDirection: 'column', 
        flexWrap: 'nowrap',
        justifyContent: 'start',
        alignItems: 'stretch',
        gap: 16,
        columnCount: 3, 
      },
      propSchema: {
        width: { label: 'Width', type: 'text', description: 'e.g. 100%, 300px' },
        height: { label: 'Height', type: 'text', description: 'e.g. auto, 500px' },
        padding: { label: 'Padding', type: 'select', options: ['p-0', 'p-2', 'p-4', 'p-8'] },
        background: { label: 'Background', type: 'color' },
        borderColor: { label: 'Border Color', type: 'color' },
        borderWidth: { label: 'Border Width', type: 'select', options: ['0px', '1px', '2px', '4px', '1px dashed'] },
        visible: { label: 'Visible', type: 'boolean' },
        // Layout Engine
        layoutMode: { label: 'Layout Mode', type: 'select', options: ['flex', 'grid', 'masonry'] },
        flexDirection: { label: 'Direction (Flex)', type: 'select', options: ['row', 'column'] },
        flexWrap: { label: 'Wrap (Flex)', type: 'select', options: ['nowrap', 'wrap'] },
        justifyContent: { label: 'Justify', type: 'select', options: ['start', 'center', 'end', 'space-between'] },
        alignItems: { label: 'Align', type: 'select', options: ['start', 'center', 'end', 'stretch'] },
        gap: { label: 'Gap (px)', type: 'number' },
        columnCount: { label: 'Columns (Grid/Masonry)', type: 'number' },
      }
    },
    Button: {
      type: 'Button',
      label: 'Action Button',
      category: 'Basic',
      icon: MousePointerClick,
      defaultProps: {
        text: 'Update Status',
        variant: 'blue',
        size: 'md',
        actionType: 'controlComponent', // Default to new action for demo
        // API Props
        variableKey: '',
        variableValue: '',
        apiUrl: 'https://jsonplaceholder.typicode.com/users',
        method: 'GET',
        responseKey: 'tableData',
        // Component Control Props
        targetId: '', 
        targetProp: 'color',
        targetValue: 'green'
      },
      propSchema: {
        text: { label: 'Button Text', type: 'text' },
        variant: { label: 'Color Variant', type: 'select', options: ['blue', 'gray', 'red', 'green'] },
        size: { label: 'Size', type: 'select', options: ['sm', 'md', 'lg'] },
        actionType: { label: 'Interaction', type: 'select', options: ['none', 'setVariable', 'apiRequest', 'controlComponent', 'alert'], description: 'Action on click' },
        
        // Control Component Props
        targetId: { label: 'Target ID', type: 'text', description: 'ID of component to control' },
        targetProp: { label: 'Target Prop', type: 'text', description: 'Property to update (e.g. color, visible)' },
        targetValue: { label: 'New Value', type: 'text', description: 'Value to set (true/false/red)' },

        // Set Variable Props
        variableKey: { label: 'Set Var Name', type: 'text' },
        variableValue: { label: 'Set Var Value', type: 'text' },
        
        // API Request Props
        apiUrl: { label: 'API URL', type: 'api' },
        method: { label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] },
        responseKey: { label: 'Save Response To', type: 'text' }
      }
    },
    Tag: {
      type: 'Tag',
      label: 'Status Tag',
      category: 'Basic',
      icon: Type,
      defaultProps: {
        label: 'Status: Pending',
        color: 'gray',
        visible: true
      },
      propSchema: {
        label: { label: 'Tag Label', type: 'text', description: 'Supports {userData.name}' },
        color: { label: 'Color Theme', type: 'select', options: ['green', 'blue', 'yellow', 'red', 'purple', 'gray'] },
        visible: { label: 'Visible', type: 'boolean' }
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
        trendColor: 'gray',
        visible: true
      },
      propSchema: {
        title: { label: 'Metric Title', type: 'text' },
        value: { label: 'Display Value', type: 'text' },
        trend: { label: 'Trend Label', type: 'text' },
        trendColor: { label: 'Trend Color', type: 'select', options: ['green', 'red', 'gray'] },
        visible: { label: 'Visible', type: 'boolean' }
      }
    },
    DataTable: {
      type: 'DataTable',
      label: 'Data Table',
      category: 'Data',
      icon: Table,
      defaultProps: {
        dataSourceType: 'variable',
        apiEndpoint: '/api/users/list',
        dataVariable: 'tableData',
        rowsPerPage: 5,
        columns: '[{"key": "id", "title": "ID"}, {"key": "name", "title": "Name"}, {"key": "email", "title": "Email"}]',
        visible: true
      },
      propSchema: {
        dataSourceType: { label: 'Data Source', type: 'select', options: ['api', 'variable'] },
        apiEndpoint: { label: 'API Endpoint', type: 'api' },
        dataVariable: { label: 'Data Variable', type: 'text' },
        rowsPerPage: { label: 'Rows Per Page', type: 'number' },
        columns: { label: 'Columns JSON', type: 'json' },
        visible: { label: 'Visible', type: 'boolean' }
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
        dataUrl: '/api/metrics/traffic?period={period}',
        visible: true
      },
      propSchema: {
        title: { label: 'Chart Title', type: 'text' },
        type: { label: 'Chart Type', type: 'select', options: ['bar', 'line', 'area'] },
        dataUrl: { label: 'Data Source', type: 'api' },
        visible: { label: 'Visible', type: 'boolean' }
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
      isContainer: true, 
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
