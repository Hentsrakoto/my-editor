import React from "react";
import { Save, Code, Type, Maximize, Minimize } from "lucide-react";

export default function EditorToolbar({
  path,
  language,
  fontSize,
  onIncreaseFont,
  onDecreaseFont,
  onSave,
  isFullscreen,
  toggleFullscreen,
  dirty
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800/90 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center text-sm font-medium bg-gray-700/50 px-2 py-1 rounded">
          <Code size={14} className="mr-1 text-blue-400" />
          <span className="truncate max-w-xs md:max-w-md">{path}</span>
          {dirty && <span className="text-yellow-400 ml-1">*</span>}
        </div>
        <div className="hidden md:flex items-center text-xs bg-gray-900 px-2 py-1 rounded border border-gray-700">
          <Type size={12} className="mr-1 text-purple-400" />
          {language?.toUpperCase()}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-900 rounded border border-gray-700 overflow-hidden">
          <button onClick={onDecreaseFont} className="px-2 py-1 hover:bg-gray-800 transition" title="Réduire la taille">
            A−
          </button>
          <span className="px-2 text-xs">{fontSize}px</span>
          <button onClick={onIncreaseFont} className="px-2 py-1 hover:bg-gray-800 transition" title="Augmenter la taille">
            A+
          </button>
        </div>

        <button onClick={toggleFullscreen} className="p-1.5 rounded hover:bg-gray-700 transition" title="Plein écran">
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 transition text-white font-medium"
          title="Sauvegarder (Ctrl+S)"
        >
          <Save size={16} />
          <span className="hidden sm:inline">Sauvegarder</span>
        </button>
      </div>
    </div>
  );
}
