import { atom } from 'jotai';
import type { PrimitiveAtom, WritableAtom } from 'jotai';
import { ComponentInstance } from '../../domain/Component';
import { CanvasLayout } from '../../domain/CanvasLayout';
import { PublishService } from '../../application/services/PublishService';
import { fetchRemoteComponentSchema } from '../api/fetchComponentProps';

// --- State Atoms ---
// Explicitly type as PrimitiveAtom to ensure they are writable and compatible with 'set' in action atoms
export const treeAtom: PrimitiveAtom<ComponentInstance[]> = atom<ComponentInstance[]>([]);
export const selectedIdAtom: PrimitiveAtom<string | null> = atom<string | null>(null);

// --- History State ---
interface HistoryState {
  past: ComponentInstance[][];
  future: ComponentInstance[][];
}

export const historyAtom: PrimitiveAtom<HistoryState> = atom<HistoryState>({
  past: [],
  future: [],
});

// --- Runtime Interaction State ---
// Stores global variables for component interaction (e.g., { "selectedStatus": "active" })
export const runtimeVariablesAtom: PrimitiveAtom<Record<string, any>> = atom<Record<string, any>>({});

// Publishing State
export const isPublishingAtom: PrimitiveAtom<boolean> = atom<boolean>(false);
export const publishResultAtom: PrimitiveAtom<string | null> = atom<string | null>(null);

// --- Derived Atoms (Selectors) ---
export const selectedComponentAtom = atom((get) => {
  const tree = get(treeAtom);
  const id = get(selectedIdAtom);
  return CanvasLayout.findNode(tree, id);
});

// --- Helper: Save History ---
const saveHistory = (get: any, set: any) => {
  const currentTree = get(treeAtom);
  set(historyAtom, (prev: HistoryState) => ({
    past: [...prev.past, currentTree],
    future: [] // Clear future when a new action is performed
  }));
};

// --- Action Atoms (Interactors) ---

// Undo Action
export const undoAtom: WritableAtom<null, [], void> = atom(
  null,
  (get, set) => {
    const history = get(historyAtom);
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    const current = get(treeAtom);

    set(treeAtom, previous);
    set(historyAtom, {
      past: newPast,
      future: [current, ...history.future]
    });
    // Optional: Deselect if the selected item no longer exists, 
    // but usually keeping ID is fine or resetting to null
  }
);

// Redo Action
export const redoAtom: WritableAtom<null, [], void> = atom(
  null,
  (get, set) => {
    const history = get(historyAtom);
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);
    const current = get(treeAtom);

    set(treeAtom, next);
    set(historyAtom, {
      past: [...history.past, current],
      future: newFuture
    });
  }
);

// Add Component to Tree
export const addComponentAtom: WritableAtom<null, [{ newItem: ComponentInstance; targetId?: string }], void> = atom(
  null,
  (get, set, { newItem, targetId }: { newItem: ComponentInstance; targetId?: string }) => {
    saveHistory(get, set); // Save state before change
    const tree = get(treeAtom);
    const newTree = CanvasLayout.addChild(tree, targetId || null, newItem);
    set(treeAtom, newTree);
    set(selectedIdAtom, newItem.id);
  }
);

// Update Component Props
export const updateComponentAtom: WritableAtom<null, [{ id: string; updates: Partial<ComponentInstance> }], void> = atom(
  null,
  (get, set, { id, updates }: { id: string; updates: Partial<ComponentInstance> }) => {
     saveHistory(get, set); // Save state before change
     const tree = get(treeAtom);
     const newTree = CanvasLayout.updateNode(tree, id, (node) => ({ ...node, ...updates }));
     set(treeAtom, newTree);
  }
);

// Delete Component
export const deleteComponentAtom: WritableAtom<null, [string], void> = atom(
  null,
  (get, set, id: string) => {
    saveHistory(get, set); // Save state before change
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
export const publishConfigAtom: WritableAtom<null, [], Promise<void>> = atom(
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
export const fetchRemoteSchemaAtom: WritableAtom<null, [{ id: string, moduleUrl: string }], Promise<void>> = atom(
  null,
  async (get, set, { id, moduleUrl }: { id: string, moduleUrl: string }) => {
    try {
      const dynamicSchema = await fetchRemoteComponentSchema(moduleUrl);
      
      // We generally want to save history for remote schema updates as they change the node structure
      // However, since this is async and often triggered by effects, be careful of loops.
      // For now, we enable history for this.
      saveHistory(get, set); 
      
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