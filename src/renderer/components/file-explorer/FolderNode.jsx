// components/file-explorer/FolderNode.jsx
import React, { useCallback, useEffect, useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, RefreshCw } from "lucide-react";
import { getFileIcon, formatFileSize } from "../../utils/fsUtils";

/**
 * FolderNode (pure-ish presentational with local UI state)
 * - props: path, name, level, handlers (readDir, onOpenFile, create, copy/cut/paste, remove, rename), refreshTrigger
 */
export default function FolderNode({
  path,
  name,
  level = 0,
  readDir,
  onOpenFile,
  onCreateItem,
  onDeleteItem,
  onRenameItem,
  clipboard,
  onCopy,
  onCut,
  onPaste,
  refreshTrigger,
  currentFilePath
}) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isFile, setIsFile] = useState(true);
  const [contextMenu, setContextMenu] = useState(null); // {x,y,isDir,itemPath,itemName}

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const e = await readDir(path);
      setEntries(e);
    } catch (err) {
      console.error("readDir err", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [path, readDir]);

  useEffect(() => {
    if (!open) return;
    loadEntries();
  }, [open, loadEntries, refreshTrigger]);

  const toggle = () => setOpen(o => !o);

  const handleCreate = (asFile) => {
    setIsCreating(true);
    setIsFile(asFile);
    setNewName(asFile ? "nouveau_fichier.txt" : "nouveau_dossier");
  };
  const cancelCreate = () => { setIsCreating(false); setNewName(""); };
  const confirmCreate = async () => {
    if (!newName.trim()) return;
    const full = `${path}/${newName}`;
    if (isFile) await onCreateItem(full, true);
    else await onCreateItem(full, false);
    setIsCreating(false); setNewName("");
    // reload: loadEntries is triggered via refreshTrigger in parent container
  };

  const handleContext = (e, isDirectory, itemPath, itemName) => {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, isDirectory, itemPath, itemName });
  };

  useEffect(() => {
    const onDocClick = () => setContextMenu(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div style={{ paddingLeft: `${level * 12}px` }}>
      <div
        onClick={toggle}
        onContextMenu={(e) => handleContext(e, true, path, name)}
        className="flex items-center gap-1 cursor-pointer font-medium text-gray-200 hover:bg-gray-700 px-2 py-1 rounded transition-colors duration-150 group"
      >
        {loading ? <RefreshCw size={14} className="animate-spin text-gray-400" /> :
          open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}

        {open ? <FolderOpen size={16} className="text-yellow-400" /> : <Folder size={16} className="text-yellow-500" />}
        <span className="truncate flex-1">{name}</span>
      </div>

      {open && (
        <div className="ml-3 border-l border-gray-700 pl-1">
          {isCreating && (
            <div className="flex items-center gap-1 pl-5 text-gray-300 px-2 py-1">
              {isFile ? <FileText size={14} className="text-gray-400" /> : <Folder size={14} className="text-yellow-500" />}
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={cancelCreate}
                onKeyDown={(e) => { if (e.key === "Enter") confirmCreate(); if (e.key === "Escape") cancelCreate(); }}
                className="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-sm w-full"
              />
            </div>
          )}

          {entries.map(entry => {
            const fullPath = `${path}/${entry.name}`;
            if (entry.isDir) {
              return (
                <FolderNode
                  key={fullPath}
                  path={fullPath}
                  name={entry.name}
                  level={level + 1}
                  readDir={readDir}
                  onOpenFile={onOpenFile}
                  onCreateItem={onCreateItem}
                  onDeleteItem={onDeleteItem}
                  onRenameItem={onRenameItem}
                  clipboard={clipboard}
                  onCopy={onCopy}
                  onCut={onCut}
                  onPaste={onPaste}
                  refreshTrigger={refreshTrigger}
                  currentFilePath={currentFilePath}
                />
              );
            }

            const isActive = currentFilePath && currentFilePath === fullPath;
            return (
              <div
                key={fullPath}
                onClick={() => onOpenFile(fullPath)}
                onContextMenu={(ev) => handleContext(ev, false, fullPath, entry.name)}
                className={`flex items-center gap-1 pl-5 cursor-pointer text-gray-300 hover:bg-gray-700 px-2 py-1 rounded transition-colors duration-150 group ${isActive ? "bg-gray-900 text-white" : ""}`}
              >
                {getFileIcon(entry.name)}
                <span className="truncate flex-1">{entry.name}</span>
                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{entry.size ? formatFileSize(entry.size) : ""}</span>
              </div>
            );
          })}
        </div>
      )}

      {contextMenu && contextMenu.visible && (
        <div className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg py-1 z-10" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer flex items-center gap-2" onClick={() => { onCopy && onCopy(contextMenu.itemPath, contextMenu.isDirectory); setContextMenu(null); }}>Copier</div>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer flex items-center gap-2" onClick={() => { onCut && onCut(contextMenu.itemPath, contextMenu.isDirectory); setContextMenu(null); }}>Couper</div>
          {clipboard && <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer flex items-center gap-2" onClick={() => { onPaste && onPaste(path); setContextMenu(null); }}>Coller</div>}
          <div className="border-t border-gray-700 my-1"></div>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer" onClick={() => { handleCreate(true); setContextMenu(null); }}>Nouveau fichier</div>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer" onClick={() => { handleCreate(false); setContextMenu(null); }}>Nouveau dossier</div>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer text-red-400" onClick={() => { onDeleteItem && onDeleteItem(contextMenu.itemPath, contextMenu.isDirectory); setContextMenu(null); }}>Supprimer</div>
        </div>
      )}
    </div>
  );
}
