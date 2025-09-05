import React from "react";
import Editor from "@monaco-editor/react";
import { Save } from "lucide-react";

export default function EditorTab({ file, onChange, onSave }) {
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-900">
        Aucun fichier ouvert
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 text-gray-200">
      {/* Barre supérieure façon VSCode */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700 bg-gray-800 text-sm">
        <div className="truncate">
          {file.path}
          {file.dirty && <span className="text-yellow-400 ml-1">*</span>}
        </div>
        <button
          onClick={onSave}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 transition"
        >
          <Save size={16} className="text-green-400" />
          <span className="hidden sm:inline">Sauvegarder</span>
        </button>
      </div>

      {/* Zone de l'éditeur */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={file.content}
          onChange={onChange}
          theme="vs-dark" // VSCode dark theme
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
