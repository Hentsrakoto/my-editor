import React from "react";
import { Save, Code, Type, Maximize, Minimize, X } from "lucide-react";

function basename(p) {
  if (!p) return "Sans nom";
  const normalized = p.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || p;
}

export default function EditorToolbar({
  files = [],                // [{id, path, dirty}]
  activeFileId,
  onSelectFile,
  onCloseFile,
  currentPath = "",          // path complet du fichier actif (affiché en haut)
  language,
  fontSize,
  onIncreaseFont,
  onDecreaseFont,
  onSave,
  isFullscreen,
  toggleFullscreen,
}) {
  return (
    <div className="flex flex-col px-2 py-1 border-b border-gray-700 bg-gray-800/90 backdrop-blur-sm">
      {/* Ligne du path complet */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <Code size={14} className="text-blue-400" />
          <span className="truncate max-w-xs md:max-w-2xl">{currentPath || "Sans chemin"}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center text-xs bg-gray-900 px-2 py-1 rounded border border-gray-700">
            <Type size={12} className="mr-1 text-purple-400" />
            {language?.toUpperCase()}
          </div>

          <div className="flex items-center bg-gray-900 rounded border border-gray-700 overflow-hidden">
            <button onClick={onDecreaseFont} className="px-2 py-1 hover:bg-gray-800 transition" title="Réduire la taille">A−</button>
            <span className="px-2 text-xs">{fontSize}px</span>
            <button onClick={onIncreaseFont} className="px-2 py-1 hover:bg-gray-800 transition" title="Augmenter la taille">A+</button>
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

      {/* Ligne des onglets (n'affiche que le nom du fichier) */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className={`flex items-center px-3 py-1 rounded-t-md cursor-pointer select-none whitespace-nowrap
              ${file.id === activeFileId 
                ? "bg-gray-900 text-white border border-gray-700 border-b-0" 
                : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"}`}
            onClick={() => onSelectFile?.(file.id)}
            title={file.path}
          >
            <span className="text-sm font-medium max-w-[140px] truncate">{basename(file.path)}</span>
            {file.dirty && <span className="text-yellow-400 ml-2">*</span>}
            <button
              className="ml-2 hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                onCloseFile?.(file.id);
              }}
              title="Fermer l'onglet"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
