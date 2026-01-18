
import { LucideIcon } from 'lucide-react';
import { Configurable, PropSchema } from './Configurable';

export type ComponentType = 'Container' | 'Button' | 'Tag' | 'MetricCard' | 'DataTable' | 'Chart' | 'RemoteWidget';

export interface ComponentDefinition extends Configurable {
  type: ComponentType;
  label: string;
  category: 'Basic' | 'Data' | 'Module Federation';
  icon: LucideIcon;
  isContainer?: boolean;
}

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  children: ComponentInstance[];
  parentId?: string | null;
  dynamicSchema?: Record<string, PropSchema>;
}
