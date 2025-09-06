import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Save, FileText, Code, Type, Database, Settings, ChevronDown, Maximize, Minimize } from "lucide-react";

export default function EditorTab({ file, onChange, onSave }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    if (file) {
      const extension = file.path.split('.').pop();
      const languageMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'md': 'markdown',
        'py': 'python',
        'java': 'java',
        'php': 'php',
        'xml': 'xml',
        'sql': 'sql'
      };
      setLanguage(languageMap[extension] || 'plaintext');
    }
  }, [file]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 1, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 1, 10));
  };

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-gray-400 p-4">
        <div className="text-center max-w-md">
          <FileText size={64} className="mx-auto mb-4 text-blue-500 opacity-50" />
          <h3 className="text-xl font-medium mb-2">Aucun fichier ouvert</h3>
          <p className="text-sm">Ouvrez un fichier depuis l'explorateur ou créez-en un nouveau pour commencer à éditer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200 ${isFullscreen ? 'fixed inset-0 z-50' : 'flex-1'}`}>
      {/* Barre supérieure améliorée */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center text-sm font-medium bg-gray-700/50 px-2 py-1 rounded">
            <Code size={14} className="mr-1 text-blue-400" />
            <span className="truncate max-w-xs md:max-w-md">{file.path}</span>
            {file.dirty && <span className="text-yellow-400 ml-1">*</span>}
          </div>
          
          <div className="hidden md:flex items-center text-xs bg-gray-900 px-2 py-1 rounded border border-gray-700">
            <Type size={12} className="mr-1 text-purple-400" />
            {language.toUpperCase()}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-900 rounded border border-gray-700 overflow-hidden">
            <button 
              onClick={decreaseFontSize}
              className="px-2 py-1 hover:bg-gray-800 transition"
              title="Réduire la taille de police"
            >
              A−
            </button>
            <span className="px-2 text-xs">{fontSize}px</span>
            <button 
              onClick={increaseFontSize}
              className="px-2 py-1 hover:bg-gray-800 transition"
              title="Augmenter la taille de police"
            >
              A+
            </button>
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-gray-700 transition"
            title={isFullscreen ? "Quitter le mode plein écran" : "Mode plein écran"}
          >
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

      {/* Zone de l'éditeur */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          value={file.content}
          onChange={onChange}
          theme="vs-dark"
          options={{
            fontSize,
            minimap: { enabled: true },
            automaticLayout: true,
            wordWrap: 'on',
            smoothScrolling: true,
            cursorBlinking: 'phase',
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: true,
            scrollBeyondLastLine: false,
            rulers: [80, 120],
            lineNumbersMinChars: 3,
            folding: true,
            showFoldingControls: 'mouseover',
            parameterHints: { enabled: true },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
        />
        
        {/* Barre d'état en bas */}
        
      </div>
    </div>
  );
}