import React, { useState, useEffect } from "react";
import SidebarContainer from "../containers/SidebarContainer";
import FileExplorerContainer from "../containers/FileExplorerContainer";
import EditorTabContainer from "../containers/EditorTabContainer";
import SidebarRight from "../components/sidebar/SidebarRight";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import {
  PanelLeft,
  ChevronDown,
  ChevronRight,
  X,
  Circle,
  Zap,
  Square,
  PanelRight,
} from "lucide-react";

export default function MainLayout() {
  const [currentFolder, setCurrentFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true);
  const [encoding, setEncoding] = useState("UTF-8");
  const [lineEnding, setLineEnding] = useState("LF");

  // Effet pour gérer les raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S pour sauvegarder
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (currentFile) {
          handleSaveFile();
        }
      }

      // Ctrl+O pour ouvrir un dossier
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        handleOpenFolder();
      }

      // Ctrl+B pour basculer la sidebar droite
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentFile, isRightSidebarCollapsed]);

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
      setFiles((files) =>
        files.map((f) =>
          f.path === currentFile.path ? { ...f, dirty: false } : f
        )
      );
    }
  };

  const handleCursorChange = (position) => {
    setCursorPosition(position);
  };

  const handleNewFile = () => {
    const newFilePath = currentFolder
      ? `${currentFolder}/nouveau-fichier.js` 
      : "nouveau-fichier.js";
    const newFile = {
      path: newFilePath,
      content: "// Nouveau fichier",
      dirty: true,
    };
    setFiles((f) => [...f, newFile]);
    setCurrentFile(newFile);
  };

  const handleSettings = () => {
    console.log("Ouvrir les paramètres");
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-gray-200 overflow-hidden">
      {/* Header amélioré */}
      <header className="h-9 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>Go</span>
            <span>Exécuter</span>
            <span>Terminal</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentFile && (
            <div className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded flex items-center gap-1">
              {currentFile.dirty && (
                <Circle size={10} className="text-yellow-400 fill-yellow-400" />
              )}
              {currentFile.path.split("/").pop()}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 rounded hover:bg-gray-700 transition"
              title="Basculer la barre latérale gauche"
            >
              <PanelLeft size={16} />
            </button>

            <button
              onClick={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
              className="p-1 rounded hover:bg-gray-700 transition"
              title="Basculer l'explorateur"
            >
              {isExplorerCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {/* Nouveau bouton pour la sidebar droite */}
            <button
              onClick={() =>
                setIsRightSidebarCollapsed(!isRightSidebarCollapsed)
              }
              className="p-1 rounded hover:bg-gray-700 transition"
              title="Basculer la barre latérale droite"
            >
              <PanelRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={80} minSize={30}>
          <PanelGroup direction="horizontal">
            {!isSidebarCollapsed && (
              <Panel defaultSize={6.25} minSize={5} maxSize={15}>
                <SidebarContainer
                  onNewFile={handleNewFile}
                  onOpenFolder={async () => {
                    const folder = await window.api.openFolder();
                    if (folder) {
                      setCurrentFolder(folder);
                      setFiles([]);
                      setCurrentFile(null);
                    }
                    return folder;
                  }}
                />
              </Panel>
            )}
            {!isSidebarCollapsed && <PanelResizeHandle />} 

            {!isExplorerCollapsed && currentFolder && (
              <Panel defaultSize={18.75} minSize={10}>
                <FileExplorerContainer
                  folder={currentFolder}
                  onOpenFile={(filePath, content) => {
                    const file = { path: filePath, content, dirty: false };
                    setFiles((f) => [...f.filter((x) => x.path !== filePath), file]);
                    setCurrentFile(file);
                  }}
                  currentFilePath={currentFile?.path}
                />
              </Panel>
            )}
            {!isExplorerCollapsed && currentFolder && <PanelResizeHandle />}

            <Panel defaultSize={75} minSize={20}>
              <EditorTabContainer
                file={currentFile}
                onChangeFileContent={(updatedContent, fileId) => {
                  setCurrentFile((f) => ({ ...f, content: updatedContent, dirty: true }));
                  setFiles(files.map(f => f.path === currentFile.path ? { ...f, content: updatedContent, dirty: true } : f));
                }}
                onSaveFile={handleSaveFile}
                onCloseFile={(fileId) => {
                  setFiles(files => files.filter(f => f.path !== fileId));
                  if (currentFile?.path === fileId) {
                    setCurrentFile(files.find(f => f.path !== fileId) || null);
                  }
                }}
                onSwitchFile={(fileId) => {
                  const file = files.find(f => f.path === fileId);
                  if (file) setCurrentFile(file);
                }}
              />
            </Panel>
          </PanelGroup>
        </Panel>

        {!isRightSidebarCollapsed && <PanelResizeHandle />}

        {!isRightSidebarCollapsed && (
          <Panel defaultSize={20} minSize={15} maxSize={50}>
            <SidebarRight currentFolder={currentFolder} />
          </Panel>
        )}
      </PanelGroup>
      {/* Footer amélioré */}
      <footer className="h-6 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-3 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Circle size={10} className="text-green-500 fill-green-500" />
            Mode développement
          </span>

          <span>{encoding}</span>

          <span>{lineEnding}</span>

          <span className="flex items-center gap-1">
            <Zap size={12} />
            JavaScript
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>
            Ligne {cursorPosition.line}, Col {cursorPosition.column}
          </span>

          <span>
            {currentFile ? currentFile.content.split("\n").length : 0} lignes
          </span>

          <span>Espaces: 2</span>

          {/* Indicateur de statut de la sidebar droite */}
          <button
            onClick={() =>
              setIsRightSidebarCollapsed(!isRightSidebarCollapsed)
            }
            className="text-gray-500 hover:text-blue-400 transition-colors flex items-center"
            title={
              isRightSidebarCollapsed
                ? "Afficher la sidebar droite"
                : "Masquer la sidebar droite"
            }
          >
            {isRightSidebarCollapsed ? (
              <ChevronRight size={12} />
            ) : (
              <ChevronRight size={12} className="rotate-180" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
