
import { LucideIcon } from 'lucide-react';
import { Configurable, PropSchema } from './Configurable';

// Changed from union type to string to allow open registration
export type ComponentType = string;

export interface ComponentDefinition extends Configurable {
  type: ComponentType;
  label: string;
  category: 'Basic' | 'Data' | 'Module Federation' | 'Ant Design' | 'Interactive';
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
