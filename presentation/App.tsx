
import React from 'react';
import { LibraryPanel } from './components/LeftPanel/LibraryPanel';
import { CanvasPanel } from './components/Canvas/CanvasPanel';
import { PropertyPanel } from './components/RightPanel/PropertyPanel';

const App: React.FC = () => {
  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden font-sans text-gray-900">
      {/* 1. Left Panel: Component Library */}
      <LibraryPanel />

      {/* 2. Center Panel: Canvas */}
      <CanvasPanel />

      {/* 3. Right Panel: Configuration */}
      <PropertyPanel />
    </div>
  );
};

export default App;
