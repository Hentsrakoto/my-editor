import React, { useEffect, useState } from 'react';

// Composant récursif pour les dossiers
function FolderNode({ path, name, onOpenFile }) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);

  const toggle = async () => {
    if (!open) {
      const dirEntries = await window.api.readDir(path);
      setEntries(dirEntries);
    }
    setOpen(!open);
  };

  return (
    <div style={{ paddingLeft: 15 }}>
      <div onClick={toggle} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
        {name}/
      </div>
      {open && (
        <div>
          {entries.map((e) => {
            const fullPath = `${path}/${e.name}`;
            if (e.isDir) {
              return <FolderNode key={fullPath} path={fullPath} name={e.name} onOpenFile={onOpenFile} />;
            }
            return (
              <div
                key={fullPath}
                style={{ paddingLeft: 15, cursor: 'pointer' }}
                onClick={() => onOpenFile(fullPath)}
              >
                {e.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Composant principal
export default function FileExplorer({ folder, onOpenFile }) {
  if (!folder) return <div style={{ width: 250, padding: 10 }}>Aucun dossier ouvert</div>;

  return (
    <div style={{ width: 250, padding: 10, borderRight: '1px solid #ccc', overflowY: 'auto' }}>
      <FolderNode path={folder} name={folder.split('/').pop()} onOpenFile={onOpenFile} />
    </div>
  );
}
