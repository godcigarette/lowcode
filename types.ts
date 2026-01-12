import { LucideIcon } from 'lucide-react';

export type ComponentType = 'Container' | 'Button' | 'Tag' | 'MetricCard' | 'DataTable' | 'Chart' | 'RemoteWidget';

export interface PropSchema {
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'boolean' | 'json' | 'api' | 'event';
  options?: string[]; // For select
  defaultValue?: any;
  description?: string;
}

export interface ComponentDefinition {
  type: ComponentType;
  label: string;
  category: 'Basic' | 'Data' | 'Module Federation';
  icon: LucideIcon;
  defaultProps: Record<string, any>;
  propSchema: Record<string, PropSchema>;
  isContainer?: boolean;
}

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  children: ComponentInstance[]; // Recursive structure
  parentId?: string | null;
  dynamicSchema?: Record<string, PropSchema>; // Schema loaded from remote
}

export interface DragItem {
  type: ComponentType;
}
