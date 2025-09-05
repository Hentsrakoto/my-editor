import React, { useState } from "react";
import { Folder, FolderOpen, File } from "lucide-react";

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
    <div className="pl-3">
      <div
        onClick={toggle}
        className="flex items-center gap-1 cursor-pointer font-medium text-gray-200 hover:bg-gray-700 px-1 py-0.5 rounded"
      >
        {open ? (
          <FolderOpen size={16} className="text-yellow-400" />
        ) : (
          <Folder size={16} className="text-yellow-500" />
        )}
        <span className="truncate">{name}</span>
      </div>

      {open && (
        <div className="ml-3">
          {entries.map((e) => {
            const fullPath = `${path}/${e.name}`;
            if (e.isDir) {
              return (
                <FolderNode
                  key={fullPath}
                  path={fullPath}
                  name={e.name}
                  onOpenFile={onOpenFile}
                />
              );
            }
            return (
              <div
                key={fullPath}
                onClick={() => onOpenFile(fullPath)}
                className="flex items-center gap-1 pl-5 cursor-pointer text-gray-300 hover:bg-gray-700 px-1 py-0.5 rounded"
              >
                <File size={14} className="text-blue-400" />
                <span className="truncate">{e.name}</span>
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
  if (!folder) {
    return (
      <div className="w-64 p-3 text-gray-400 bg-gray-900">
        Aucun dossier ouvert
      </div>
    );
  }

  return (
    <div className="w-64 p-2 border-r border-gray-700 bg-gray-900 overflow-y-auto text-sm">
      <FolderNode
        path={folder}
        name={folder.split("/").pop()}
        onOpenFile={onOpenFile}
      />
    </div>
  );
}
