
import { atom } from 'jotai';
import { ComponentInstance } from '../../domain/Component';
import { CanvasLayout } from '../../domain/CanvasLayout';
import { PublishService } from '../../application/services/PublishService';
import { fetchRemoteComponentSchema } from '../api/fetchComponentProps';

// --- State Atoms ---
export const treeAtom = atom<ComponentInstance[]>([]);
export const selectedIdAtom = atom<string | null>(null);

// Publishing State
export const isPublishingAtom = atom<boolean>(false);
export const publishResultAtom = atom<string | null>(null);

// --- Derived Atoms (Selectors) ---
export const selectedComponentAtom = atom((get) => {
  const tree = get(treeAtom);
  const id = get(selectedIdAtom);
  return CanvasLayout.findNode(tree, id);
});

// --- Action Atoms (Interactors) ---

// Add Component to Tree
export const addComponentAtom = atom(
  null,
  (get, set, { newItem, targetId }: { newItem: ComponentInstance; targetId?: string }) => {
    const tree = get(treeAtom);
    const newTree = CanvasLayout.addChild(tree, targetId || null, newItem);
    set(treeAtom, newTree);
    set(selectedIdAtom, newItem.id);
  }
);

// Update Component Props
export const updateComponentAtom = atom(
  null,
  (get, set, { id, updates }: { id: string; updates: Partial<ComponentInstance> }) => {
     const tree = get(treeAtom);
     const newTree = CanvasLayout.updateNode(tree, id, (node) => ({ ...node, ...updates }));
     set(treeAtom, newTree);
  }
);

// Delete Component
export const deleteComponentAtom = atom(
  null,
  (get, set, id: string) => {
    const tree = get(treeAtom);
    const selectedId = get(selectedIdAtom);
    const newTree = CanvasLayout.removeNode(tree, id);
    set(treeAtom, newTree);
    if (selectedId === id) {
      set(selectedIdAtom, null);
    }
  }
);

// Trigger Publish Process
export const publishConfigAtom = atom(
  null,
  async (get, set) => {
    set(isPublishingAtom, true);
    set(publishResultAtom, null);
    try {
      const tree = get(treeAtom);
      const url = await PublishService.publishConfiguration(tree);
      set(publishResultAtom, url);
    } catch (e) {
      console.error("Publish failed", e);
    } finally {
      set(isPublishingAtom, false);
    }
  }
);

// Trigger Fetch Remote Schema
export const fetchRemoteSchemaAtom = atom(
  null,
  async (get, set, { id, moduleUrl }: { id: string, moduleUrl: string }) => {
    try {
      const dynamicSchema = await fetchRemoteComponentSchema(moduleUrl);
      const tree = get(treeAtom);
      const newTree = CanvasLayout.updateNode(tree, id, (node) => ({
        ...node,
        dynamicSchema
      }));
      set(treeAtom, newTree);
    } catch (e) {
      console.error("Failed to fetch remote schema", e);
    }
  }
);
