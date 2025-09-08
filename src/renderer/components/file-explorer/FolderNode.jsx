import React, { useCallback, useEffect, useState, useRef } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, RefreshCw } from "lucide-react";
import { getFileIcon, formatFileSize } from "../../utils/fsUtils";

const RenameInput = ({ currentName, onConfirm, onCancel }) => {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm(value);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onConfirm(value)} // Confirm on blur
      onKeyDown={handleKeyDown}
      className="bg-gray-800 border border-blue-500 rounded px-1 py-0.5 text-sm w-full"
    />
  );
};

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
  const [open, setOpen] = useState(level === 0); // Auto-open root
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(null); // { type: 'file' | 'dir' }
  const [renamingPath, setRenamingPath] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const e = await readDir(path);
      setEntries(e);
    } catch (err) { console.error("readDir err", err); setEntries([]); }
    finally { setLoading(false); }
  }, [path, readDir]);

  useEffect(() => {
    if (open) loadEntries();
  }, [open, loadEntries, refreshTrigger]);

  const toggle = () => setOpen(o => !o);

  const handleCreate = (type) => {
    setOpen(true);
    setIsCreating({ type });
    setContextMenu(null);
  };

  const confirmCreate = async (newName) => {
    if (!newName.trim() || !isCreating) return;
    const fullPath = `${path}/${newName}`;
    await onCreateItem(fullPath, isCreating.type === 'file');
    setIsCreating(null);
  };

  const handleRename = (itemPath, isDir) => {
    setRenamingPath(itemPath);
    setContextMenu(null);
  };

  const confirmRename = async (newName) => {
    if (!renamingPath || !newName.trim()) {
      setRenamingPath(null);
      return;
    }
    const oldPath = renamingPath;
    const dir = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = `${dir}/${newName}`;
    const isDir = entries.find(e => `${dir}/${e.name}` === oldPath)?.isDir;

    if (oldPath !== newPath) {
      await onRenameItem(oldPath, newPath, isDir);
    }
    setRenamingPath(null);
  };

  const handleContext = (e, isDirectory, itemPath, itemName) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, isDirectory, itemPath, itemName });
  };

  useEffect(() => {
    const onDocClick = () => setContextMenu(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const renderNode = (entry) => {
    const fullPath = `${path}/${entry.name}`;
    const isRenaming = renamingPath === fullPath;

    if (isRenaming) {
      return (
        <div className="flex items-center gap-1 pl-5 px-2 py-1">
          {getFileIcon(entry.name)}
          <RenameInput 
            currentName={entry.name} 
            onConfirm={confirmRename}
            onCancel={() => setRenamingPath(null)}
          />
        </div>
      );
    }

    const isActive = currentFilePath === fullPath;
    return (
      <div
        key={fullPath}
        onClick={() => onOpenFile(fullPath)}
        onContextMenu={(e) => handleContext(e, false, fullPath, entry.name)}
        className={`flex items-center gap-1 pl-5 cursor-pointer text-gray-300 hover:bg-gray-700 px-2 py-1 rounded group ${isActive ? "bg-blue-900/50 text-white" : ""}`}
      >
        {getFileIcon(entry.name)}
        <span className="truncate flex-1">{entry.name}</span>
        <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100">{entry.size ? formatFileSize(entry.size) : ""}</span>
      </div>
    );
  };

  return (
    <div style={{ paddingLeft: level > 0 ? `12px` : '0' }}>
      <div
        onClick={toggle}
        onContextMenu={(e) => handleContext(e, true, path, name)}
        className="flex items-center gap-1 cursor-pointer font-medium text-gray-200 hover:bg-gray-700 px-2 py-1 rounded group"
      >
        {loading ? <RefreshCw size={14} className="animate-spin" /> : (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        {open ? <FolderOpen size={16} className="text-yellow-400" /> : <Folder size={16} className="text-yellow-500" />}
        <span className="truncate flex-1">{name}</span>
      </div>

      {open && (
        <div className="ml-3 border-l border-gray-700 pl-1">
          {entries.map(entry => (
            entry.isDir ? (
              <FolderNode key={`${path}/${entry.name}`} {...{ ...props, path: `${path}/${entry.name}`, name: entry.name, level: level + 1 }} />
            ) : (
              renderNode(entry)
            )
          ))}

          {isCreating && (
            <div className="flex items-center gap-1 pl-5 px-2 py-1">
              {isCreating.type === 'file' ? <FileText size={14} /> : <Folder size={14} />}
              <RenameInput 
                currentName={isCreating.type === 'file' ? 'nouveau-fichier.txt' : 'nouveau-dossier'}
                onConfirm={confirmCreate}
                onCancel={() => setIsCreating(null)}
              />
            </div>
          )}
        </div>
      )}

      {contextMenu && contextMenu.visible && (
        <div className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg py-1 z-10 text-sm" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer" onClick={() => handleCreate('file')}>Nouveau fichier</div>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer" onClick={() => handleCreate('dir')}>Nouveau dossier</div>
          <div className="border-t border-gray-700 my-1"></div>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer" onClick={() => onCopy(contextMenu.itemPath, contextMenu.isDirectory)}>Copier</div>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer" onClick={() => onCut(contextMenu.itemPath, contextMenu.isDirectory)}>Couper</div>
          {clipboard && <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer" onClick={() => onPaste(path)}>Coller</div>}
          <div className="border-t border-gray-700 my-1"></div>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer" onClick={() => handleRename(contextMenu.itemPath, contextMenu.isDirectory)}>Renommer</div>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer text-red-400" onClick={() => onDeleteItem(contextMenu.itemPath, contextMenu.isDirectory)}>Supprimer</div>
        </div>
      )}
    </div>
  );
}