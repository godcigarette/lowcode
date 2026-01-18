
import { ComponentInstance, ComponentType } from '../../domain/Component';
import { ComponentRegistryService } from '../services/ComponentRegistryService';

export class DragDropUsecase {
  static createComponentInstance(type: ComponentType, parentId?: string): ComponentInstance {
    const definition = ComponentRegistryService.get(type);
    const newId = `comp_${Date.now()}`;
    
    return {
      id: newId,
      type: type,
      props: { ...definition.defaultProps },
      children: [],
      parentId: parentId || null
    };
  }
}
