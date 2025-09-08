import React, { useState, useEffect } from "react";
import SidebarContainer from "../containers/SidebarContainer";
import FileExplorerContainer from "../containers/FileExplorerContainer";
import EditorTabContainer from "../containers/EditorTabContainer";
import SidebarRight from "../components/sidebar/SidebarRight";
import SearchContainer from "../components/search/SearchContainer"; // Assurez-vous que le chemin est correct
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
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false); // Maintenu pour le bouton
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true);
  const [encoding, setEncoding] = useState("UTF-8");
  const [lineEnding, setLineEnding] = useState("LF");
  const [sidebarView, setSidebarView] = useState('files'); // 'files' ou 'search'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentFile) handleSaveFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenFolder();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        handleToggleSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFile, isRightSidebarCollapsed]);

  const handleOpenFolder = async () => {
    const folder = await window.api.openFolder();
    if (folder) {
      setCurrentFolder(folder);
      setFiles([]);
      setCurrentFile(null);
      setSidebarView('files'); // Revenir à l'explorateur lors de l'ouverture d'un dossier
    }
  };

  const handleSaveFile = async () => {
    if (currentFile) {
      await window.api.writeFile(currentFile.path, currentFile.content);
      setCurrentFile((f) => ({ ...f, dirty: false }));
      setFiles((files) => files.map((f) => f.path === currentFile.path ? { ...f, dirty: false } : f));
    }
  };

  const handleNewFile = () => {
    const newFilePath = currentFolder ? `${currentFolder}/nouveau-fichier.js` : "nouveau-fichier.js";
    const newFile = { path: newFilePath, content: "// Nouveau fichier", dirty: true };
    setFiles((f) => [...f, newFile]);
    setCurrentFile(newFile);
  };

  const handleToggleSearch = () => {
    setSidebarView(v => v === 'search' ? 'files' : 'search');
  };

  const handleOpenFile = (filePath, content, lineNumber) => {
    const file = { path: filePath, content, dirty: false, initialLine: lineNumber };
    // Éviter les doublons dans la liste des fichiers ouverts
    if (!files.some(f => f.path === filePath)) {
      setFiles(f => [...f, file]);
    }
    setCurrentFile(file);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-gray-200 overflow-hidden">
      <header>{/* ... */}</header>

      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={5} minSize={3} maxSize={10}>
            <SidebarContainer
              onNewFile={handleNewFile}
              onOpenFolder={handleOpenFolder}
              onToggleSearch={handleToggleSearch}
            />
        </Panel>
        <PanelResizeHandle />

        {currentFolder && (
          <Panel defaultSize={20} minSize={15}>
            {sidebarView === 'files' ? (
              <FileExplorerContainer
                folder={currentFolder}
                onOpenFile={handleOpenFile}
                currentFilePath={currentFile?.path}
              />
            ) : (
              <SearchContainer
                directory={currentFolder}
                onOpenFile={handleOpenFile}
              />
            )}
          </Panel>
        )}
        {currentFolder && <PanelResizeHandle />}

        <Panel defaultSize={75} minSize={20}>
          <EditorTabContainer
            file={currentFile}
            onChangeFileContent={(updatedContent, fileId) => {
              setCurrentFile((f) => ({ ...f, content: updatedContent, dirty: true }));
              setFiles(files.map(f => f.path === fileId ? { ...f, content: updatedContent, dirty: true } : f));
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

        {!isRightSidebarCollapsed && <PanelResizeHandle />}

        {!isRightSidebarCollapsed && (
          <Panel defaultSize={20} minSize={15} maxSize={50}>
            <SidebarRight currentFolder={currentFolder} />
          </Panel>
        )}
      </PanelGroup>

      <footer>{/* ... */}</footer>
    </div>
  );
}