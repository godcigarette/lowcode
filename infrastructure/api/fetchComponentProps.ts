
import { PropSchema } from '../../domain/Configurable';

export const fetchRemoteComponentSchema = async (moduleUrl: string): Promise<Record<string, PropSchema>> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const newDynamicSchema: Record<string, PropSchema> = {};
  
  // Mock logic: generate schema based on keywords in URL
  if (moduleUrl && moduleUrl.includes('user')) {
    newDynamicSchema['remoteUserType'] = {
      label: 'Remote User Type',
      type: 'select',
      options: ['Admin', 'Guest', 'SuperUser'],
      description: 'Loaded dynamically from User Module'
    };
    newDynamicSchema['remoteDebug'] = {
      label: 'Debug Mode',
      type: 'boolean'
    };
  } else if (moduleUrl && moduleUrl.includes('chart')) {
    newDynamicSchema['theme'] = {
      label: 'Chart Theme',
      type: 'select',
      options: ['Light', 'Dark', 'System']
    };
  }

  return newDynamicSchema;
};
