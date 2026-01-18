
export interface PropSchema {
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'boolean' | 'json' | 'api' | 'event';
  options?: string[]; // For select
  defaultValue?: any;
  description?: string;
}

export interface Configurable {
  propSchema: Record<string, PropSchema>;
  defaultProps: Record<string, any>;
}
