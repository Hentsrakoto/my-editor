import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import FileExplorer from './components/FileExplorer';
import EditorTab from './components/EditorTab';

export default function App() {
  const [currentFolder, setCurrentFolder] = useState(null);
  const [files, setFiles] = useState([]); // liste des fichiers ouverts
  const [currentFile, setCurrentFile] = useState(null);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar onOpenFolder={setCurrentFolder} />
      <FileExplorer
        folder={currentFolder}
        onOpenFile={async (filePath) => {
          const content = await window.api.readFile(filePath);
          const file = { path: filePath, content, dirty: false };
          setFiles((f) => [...f.filter(x => x.path !== filePath), file]);
          setCurrentFile(file);
        }}
      />
      <EditorTab
        file={currentFile}
        onChange={(updatedContent) => {
          setCurrentFile(f => ({ ...f, content: updatedContent, dirty: true }));
        }}
        onSave={async () => {
          if (currentFile) {
            await window.api.writeFile(currentFile.path, currentFile.content);
            setCurrentFile(f => ({ ...f, dirty: false }));
          }
        }}
      />
    </div>
  );
}
