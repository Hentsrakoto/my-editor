import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import FileExplorer from "../components/FileExplorer";
import EditorTab from "../components/EditorTab";

export default function MainLayout() {
  const [currentFolder, setCurrentFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [encoding, setEncoding] = useState("UTF-8");
  const [lineEnding, setLineEnding] = useState("LF");

  // Effet pour gérer les raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S pour sauvegarder
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentFile) {
          handleSaveFile();
        }
      }
      
      // Ctrl+O pour ouvrir un dossier
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenFolder();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFile]);

  const handleOpenFolder = async () => {
    const folder = await window.api.openFolder();
    if (folder) {
      setCurrentFolder(folder);
      setFiles([]);
      setCurrentFile(null);
    }
  };

  const handleSaveFile = async () => {
    if (currentFile) {
      await window.api.writeFile(currentFile.path, currentFile.content);
      setCurrentFile((f) => ({ ...f, dirty: false }));
      setFiles(files => files.map(f => 
        f.path === currentFile.path ? { ...f, dirty: false } : f
      ));
    }
  };

  const handleCursorChange = (position) => {
    setCursorPosition(position);
  };

  const handleNewFile = () => {
    // Implémentation pour créer un nouveau fichier
    const newFilePath = currentFolder ? `${currentFolder}/nouveau-fichier.js` : 'nouveau-fichier.js';
    const newFile = { path: newFilePath, content: '// Nouveau fichier', dirty: true };
    setFiles((f) => [...f, newFile]);
    setCurrentFile(newFile);
  };

  const handleSettings = () => {
    // Ouvrir les paramètres
    console.log("Ouvrir les paramètres");
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-gray-200 overflow-hidden">
      {/* Header amélioré */}
      <header className="h-9 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 text-sm">
        <div className="flex items-center gap-4">
          <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CodeEditor
          </span>
          
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>Fichier</span>
            <span>Édition</span>
            <span>Affichage</span>
            <span>Go</span>
            <span>Exécuter</span>
            <span>Terminal</span>
            <span>Aide</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentFile && (
            <div className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
              {currentFile.dirty && <span className="text-yellow-400 mr-1">●</span>}
              {currentFile.path.split('/').pop()}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded hover:bg-gray-700 transition"
              title="Basculer la barre latérale"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
            
            <button 
              onClick={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
              className="p-1 rounded hover:bg-gray-700 transition"
              title="Basculer l'explorateur"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal amélioré */}
      <div className="flex flex-1 overflow-hidden">
        {!isSidebarCollapsed && (
          <Sidebar 
            onOpenFolder={handleOpenFolder} 
            onNewFile={handleNewFile}
            onSettings={handleSettings}
          />
        )}

        {!isExplorerCollapsed && currentFolder && (
          <FileExplorer
            folder={currentFolder}
            onOpenFile={async (filePath) => {
              const content = await window.api.readFile(filePath);
              const file = { path: filePath, content, dirty: false };
              setFiles((f) => [...f.filter((x) => x.path !== filePath), file]);
              setCurrentFile(file);
            }}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {files.length > 0 && (
            <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
              {files.map((file) => (
                <div
                  key={file.path}
                  onClick={() => setCurrentFile(file)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-gray-700 cursor-pointer transition-colors ${
                    currentFile?.path === file.path
                      ? "bg-gray-900 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-750"
                  }`}
                >
                  <span className="truncate max-w-xs">{file.path.split("/").pop()}</span>
                  {file.dirty && <span className="text-yellow-400">●</span>}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiles(files.filter(f => f.path !== file.path));
                      if (currentFile?.path === file.path) {
                        setCurrentFile(files.find(f => f.path !== file.path) || null);
                      }
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <EditorTab
            file={currentFile}
            onChange={(updatedContent) => {
              setCurrentFile((f) => ({
                ...f,
                content: updatedContent,
                dirty: true,
              }));
              setFiles(files => files.map(f => 
                f.path === currentFile.path ? { ...f, content: updatedContent, dirty: true } : f
              ));
            }}
            onSave={handleSaveFile}
            onCursorChange={handleCursorChange}
          />
        </div>
      </div>

      {/* Footer amélioré */}
      <footer className="h-6 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-3 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Mode développement
          </span>
          
          <span>{encoding}</span>
          
          <span>{lineEnding}</span>
          
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            JavaScript
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>Ligne {cursorPosition.line}, Col {cursorPosition.column}</span>
          
          <span>{currentFile ? currentFile.content.split('\n').length : 0} lignes</span>
          
          <span>Espaces: 2</span>
        </div>
      </footer>
    </div>
  );
}