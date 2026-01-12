import React, { useState } from 'react';
import { ComponentLibrary, Canvas, PropertyPanel } from './components/EditorComponents';
import { ComponentInstance } from './types';

// Helper to deeply update the tree
const updateNodeInTree = (
  nodes: ComponentInstance[], 
  id: string, 
  updateFn: (node: ComponentInstance) => ComponentInstance
): ComponentInstance[] => {
  return nodes.map(node => {
    if (node.id === id) {
      return updateFn(node);
    }
    if (node.children.length > 0) {
      return { ...node, children: updateNodeInTree(node.children, id, updateFn) };
    }
    return node;
  });
};

// Helper to find a node by ID (for selection)
const findNode = (nodes: ComponentInstance[], id: string): ComponentInstance | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children.length > 0) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

// Helper to remove a node
const removeNodeFromTree = (nodes: ComponentInstance[], id: string): ComponentInstance[] => {
  return nodes.filter(node => node.id !== id).map(node => ({
    ...node,
    children: removeNodeFromTree(node.children, id)
  }));
};

const App: React.FC = () => {
  const [tree, setTree] = useState<ComponentInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Publish States
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  const selectedComponent = selectedId ? findNode(tree, selectedId) : null;

  const handleDrop = (newItem: ComponentInstance, targetId?: string) => {
    if (!targetId) {
      // Add to root
      setTree(prev => [...prev, newItem]);
    } else {
      // Add to container
      setTree(prev => updateNodeInTree(prev, targetId, (node) => ({
        ...node,
        children: [...node.children, newItem]
      })));
    }
    // Auto select new item
    setSelectedId(newItem.id);
  };

  const handleUpdateNode = (id: string, updates: Partial<ComponentInstance>) => {
    setTree(prev => updateNodeInTree(prev, id, (node) => ({
      ...node,
      ...updates
    })));
  };

  const handleDelete = (id: string) => {
    setTree(prev => removeNodeFromTree(prev, id));
    if (selectedId === id) setSelectedId(null);
  };

  const handlePublish = () => {
    setIsPublishing(true);
    // Simulate build process
    setTimeout(() => {
      setIsPublishing(false);
      // Simulate a random CDN version
      const version = Math.floor(Math.random() * 10000);
      setPublishResult(`https://cdn.ops-platform.com/mf/build-${version}/remoteEntry.js`);
    }, 2500);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden font-sans text-gray-900">
      {/* 1. Left Panel: Component Library */}
      <ComponentLibrary />

      {/* 2. Center Panel: Canvas */}
      <Canvas 
        tree={tree} 
        selectedId={selectedId}
        onSelect={setSelectedId}
        onDrop={handleDrop}
        onDelete={handleDelete}
        onPublish={handlePublish}
        isPublishing={isPublishing}
        publishResult={publishResult}
        closePublishModal={() => setPublishResult(null)}
      />

      {/* 3. Right Panel: Configuration */}
      <PropertyPanel 
        selectedComponent={selectedComponent}
        onUpdate={handleUpdateNode}
      />
    </div>
  );
};

export default App;
