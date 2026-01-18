
import { ComponentInstance } from './Component';

export class CanvasLayout {
  static updateNode(
    nodes: ComponentInstance[], 
    id: string, 
    updateFn: (node: ComponentInstance) => ComponentInstance
  ): ComponentInstance[] {
    return nodes.map(node => {
      if (node.id === id) {
        return updateFn(node);
      }
      if (node.children.length > 0) {
        return { ...node, children: this.updateNode(node.children, id, updateFn) };
      }
      return node;
    });
  }

  static findNode(nodes: ComponentInstance[], id: string | null): ComponentInstance | null {
    if (!id) return null;
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children.length > 0) {
        const found = this.findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  static removeNode(nodes: ComponentInstance[], id: string): ComponentInstance[] {
    return nodes.filter(node => node.id !== id).map(node => ({
      ...node,
      children: this.removeNode(node.children, id)
    }));
  }

  static addChild(nodes: ComponentInstance[], parentId: string | null, child: ComponentInstance): ComponentInstance[] {
    if (!parentId) {
      return [...nodes, child];
    }
    return this.updateNode(nodes, parentId, (node) => ({
      ...node,
      children: [...node.children, child]
    }));
  }
}
