import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import FileExplorer from "../components/FileExplorer";
import EditorTab from "../components/EditorTab";

export default function MainLayout() {
  const [currentFolder, setCurrentFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-gray-200">
      {/* Header */}
      <header className="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-3 text-sm">
        VSCode-like Editor
      </header>

      {/* Contenu principal */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onOpenFolder={setCurrentFolder} />

        <FileExplorer
          folder={currentFolder}
          onOpenFile={async (filePath) => {
            const content = await window.api.readFile(filePath);
            const file = { path: filePath, content, dirty: false };
            setFiles((f) => [...f.filter((x) => x.path !== filePath), file]);
            setCurrentFile(file);
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorTab
            file={currentFile}
            onChange={(updatedContent) =>
              setCurrentFile((f) => ({
                ...f,
                content: updatedContent,
                dirty: true,
              }))
            }
            onSave={async () => {
              if (currentFile) {
                await window.api.writeFile(
                  currentFile.path,
                  currentFile.content
                );
                setCurrentFile((f) => ({ ...f, dirty: false }));
              }
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="h-6 bg-gray-800 border-t border-gray-700 flex items-center px-3 text-xs text-gray-400">
        Mode développement — UTF-8 — Ligne 1, Col 1
      </footer>
    </div>
  );
}
