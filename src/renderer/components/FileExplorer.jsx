// FileExplorer.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileImage,
  FileArchive,
  FileVideo,
  FileAudio,
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
  FolderPlus,
  FilePlus,
  Copy,
  Scissors,
  Clipboard
} from "lucide-react";

// Helpers
const normalizePath = (p = "") => p.replace(/\\/g, "/").replace(/\/+$/, "");
const getNameFromPath = (p = "") => {
  const np = normalizePath(p);
  return np.split("/").pop();
};
const sortEntries = (a, b) => {
  if (a.isDir && !b.isDir) return -1;
  if (!a.isDir && b.isDir) return 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
};

// FolderNode (récursif)
function FolderNode({
  path,
  name,
  onOpenFile,
  level = 0,
  onCreateItem,
  onDeleteItem,
  onRenameItem,
  clipboardData,
  onCopy,
  onCut,
  onPaste,
  refreshTrigger
}) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isFile, setIsFile] = useState(true);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  // Charger les entries (readDir) — uniquement quand on ouvre la branche
  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const dirEntries = await window.api.readDir(path);
      setEntries((dirEntries || []).map(e => ({
        name: e.name,
        isDir: !!(e.isDir || e.isDirectory),
        size: e.size || 0
      })).sort(sortEntries));
    } catch (error) {
      console.error("Erreur lors de la lecture du dossier:", error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [path]);

  const toggle = () => setOpen(prev => !prev);

  const handleCreateItem = (isFileType) => {
    setIsCreating(true);
    setIsFile(isFileType);
    setNewName(isFileType ? "nouveau_fichier.txt" : "nouveau_dossier");
  };

  const confirmCreate = async () => {
    if (!newName.trim()) return;
    const fullPath = `${path}/${newName}`;
    try {
      if (isFile) await window.api.writeFile(fullPath, "");
      else await window.api.mkdir(fullPath);
      setIsCreating(false);
      setNewName("");
      // ajout incrémental local (évite relecture complète)
      setEntries(prev => {
        if (prev.some(e => e.name === newName)) return prev;
        const newEntry = { name: newName, isDir: !isFile, size: 0 };
        return [...prev, newEntry].sort(sortEntries);
      });
      onCreateItem && onCreateItem(fullPath);
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      await loadEntries(); // fallback
    }
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setNewName("");
  };

  const handleContextMenu = (e, isDirectory, itemPath, itemName) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      isDirectory,
      itemPath,
      itemName
    });
  };

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, []);

  const getFileIcon = (fileName) => {
    const extension = (fileName.split('.').pop() || '').toLowerCase();
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml'].includes(extension)) return <FileCode size={14} className="text-blue-400" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) return <FileImage size={14} className="text-green-400" />;
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) return <FileArchive size={14} className="text-yellow-400" />;
    if (['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(extension)) return <FileVideo size={14} className="text-purple-400" />;
    if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) return <FileAudio size={14} className="text-pink-400" />;
    return <FileText size={14} className="text-gray-400" />;
  };

  // handler stable (useCallback) -> onFsEvent/offFsEvent must get same reference
  const handleFs = useCallback((event) => {
    if (!event || !event.path) return;
    const myPath = normalizePath(path);
    const evtPath = normalizePath(event.path);

    // ne traiter que les événements pour les enfants immédiats
    if (!evtPath.startsWith(myPath + "/")) return;
    const rel = evtPath.slice(myPath.length + 1);
    const parts = rel.split('/');
    const immediateName = parts[0];
    const isImmediate = parts.length === 1;

    if (event.type === 'add' || event.type === 'addDir') {
      setEntries(prev => {
        if (prev.some(e => e.name === immediateName)) return prev;
        const newEntry = { name: immediateName, isDir: event.type === 'addDir', size: 0 };
        return [...prev, newEntry].sort(sortEntries);
      });
    } else if (event.type === 'unlink' || event.type === 'unlinkDir') {
      setEntries(prev => prev.filter(e => e.name !== immediateName));
    } else if (event.type === 'change') {
      if (isImmediate) {
        // Optionnel: relire le fichier ou marquer pour refresh
        // loadEntries();
      }
    }
  }, [path]);

  // lifecycle: when open -> loadEntries + watchDir(path) + subscribe; when close -> unwatch + unsubscribe
  useEffect(() => {
    let mounted = true;
    if (!open) {
      // fermeture : unsubscribe & unwatch
      try { window.api.offFsEvent(handleFs); } catch (e) {}
      window.api.unwatchDir(path).catch(() => {});
      return;
    }

    (async () => {
      await loadEntries();
      try {
        await window.api.watchDir(path);
      } catch (e) {
        console.error('watchDir failed for', path, e);
      }
      // subscribe local handler (use same handleFs reference)
      window.api.onFsEvent(handleFs);
    })();

    return () => {
      if (!mounted) return;
      try { window.api.offFsEvent(handleFs); } catch (e) {}
      window.api.unwatchDir(path).catch(() => {});
      mounted = false;
    };
  }, [open, path, loadEntries, handleFs]);

  // fallback when parent asks to refresh
  useEffect(() => {
    if (open) loadEntries();
  }, [refreshTrigger]); // eslint-disable-line

  return (
    <div className={`pl-${level * 2}`}>
      <div
        onClick={toggle}
        onContextMenu={(e) => handleContextMenu(e, true, path, name)}
        className="flex items-center gap-1 cursor-pointer font-medium text-gray-200 hover:bg-gray-700 px-2 py-1 rounded transition-colors duration-150 group"
      >
        {loading ? (
          <RefreshCw size={14} className="text-gray-400 animate-spin" />
        ) : open ? (
          <ChevronDown size={14} className="text-gray-400" />
        ) : (
          <ChevronRight size={14} className="text-gray-400" />
        )}

        {open ? <FolderOpen size={16} className="text-yellow-400" /> : <Folder size={16} className="text-yellow-500" />}
        <span className="truncate flex-1">{name}</span>
        <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          {entries.length}
        </span>
      </div>

      {open && (
        <div className="ml-3 border-l border-gray-700 pl-1">
          {isCreating && (
            <div className="flex items-center gap-1 pl-5 text-gray-300 px-2 py-1">
              {isFile ? <FileText size={14} className="text-gray-400" /> : <Folder size={14} className="text-yellow-500" />}
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={cancelCreate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmCreate();
                  if (e.key === 'Escape') cancelCreate();
                }}
                className="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-sm w-full"
              />
            </div>
          )}

          {entries.map((entry) => {
            const fullPath = `${path}/${entry.name}`;
            if (entry.isDir) {
              return (
                <FolderNode
                  key={fullPath}
                  path={fullPath}
                  name={entry.name}
                  onOpenFile={onOpenFile}
                  level={level + 1}
                  onCreateItem={onCreateItem}
                  onDeleteItem={onDeleteItem}
                  onRenameItem={onRenameItem}
                  clipboardData={clipboardData}
                  onCopy={onCopy}
                  onCut={onCut}
                  onPaste={onPaste}
                  refreshTrigger={refreshTrigger}
                />
              );
            }
            return (
              <div
                key={fullPath}
                onClick={() => onOpenFile(fullPath)}
                onContextMenu={(ev) => handleContextMenu(ev, false, fullPath, entry.name)}
                className="flex items-center gap-1 pl-5 cursor-pointer text-gray-300 hover:bg-gray-700 px-2 py-1 rounded transition-colors duration-150 group"
              >
                {getFileIcon(entry.name)}
                <span className="truncate flex-1">{entry.name}</span>
                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {entry.size ? formatFileSize(entry.size) : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {contextMenu.visible && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg py-1 z-10"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div
            className="px-3 py-1 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
            onClick={() => {
              onCopy && onCopy(contextMenu.itemPath, contextMenu.isDirectory);
              closeContextMenu();
            }}
          >
            <Copy size={14} /> Copier
          </div>
          <div
            className="px-3 py-1 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
            onClick={() => {
              onCut && onCut(contextMenu.itemPath, contextMenu.isDirectory);
              closeContextMenu();
            }}
          >
            <Scissors size={14} /> Couper
          </div>
          {clipboardData && (
            <div
              className="px-3 py-1 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
              onClick={() => {
                onPaste && onPaste(path);
                closeContextMenu();
              }}
            >
              <Clipboard size={14} /> Coller
            </div>
          )}
          <div className="border-t border-gray-700 my-1"></div>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer" onClick={() => handleCreateItem(true)}>
            Nouveau fichier
          </div>
          <div className="px-3 py-1 hover:bg-gray-700 cursor-pointer" onClick={() => handleCreateItem(false)}>
            Nouveau dossier
          </div>
        </div>
      )}
    </div>
  );
}

// format taille
function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// Composant principal
export default function FileExplorer({ folder, onOpenFile, currentFile }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clipboardData, setClipboardData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // fallback global watcher (optionnel) & debounce
  const refreshTimeout = useRef(null);
  const currentFolderRef = useRef(folder);

  const normalize = (p) => (p || "").replace(/\\/g, '/').replace(/\/+$/, '');
  const isPathInside = (childPath, parentPath) => {
    if (!childPath || !parentPath) return false;
    const a = normalize(childPath).toLowerCase();
    const b = normalize(parentPath).toLowerCase();
    return a === b || a.startsWith(b.endsWith('/') ? b : b + '/');
  };

  // handler global léger (ex: reload Monaco si fichier ouvert)
  const onFsEventGlobal = useCallback((event) => {
    const evtPath = event && event.path;
    if (evtPath && isPathInside(evtPath, currentFolderRef.current || '')) {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      refreshTimeout.current = setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
        refreshTimeout.current = null;
      }, 50);
    }
  }, []);

  useEffect(() => {
    currentFolderRef.current = folder;

    if (!folder) return;

    // optional root watcher (fallback) — tu peux supprimer si tu veux juste per-folder watchers
    window.api.watchDir(folder).catch((e) => console.error('watchDir error', e));
    window.api.onFsEvent(onFsEventGlobal);

    return () => {
      try { window.api.offFsEvent(onFsEventGlobal); } catch (e) {}
      window.api.unwatchDir(folder).catch(() => {});
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
        refreshTimeout.current = null;
      }
    };
  }, [folder, onFsEventGlobal]);

  const handleCreateFile = () => {};
  const handleCreateFolder = () => {};

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleCopy = (path, isDirectory) => setClipboardData({ operation: 'copy', sourcePath: path, isDirectory });
  const handleCut = (path, isDirectory) => setClipboardData({ operation: 'cut', sourcePath: path, isDirectory });

  const handlePaste = async (destinationPath) => {
    if (!clipboardData) return;
    try {
      const sourceName = clipboardData.sourcePath.split('/').pop();
      const destination = `${destinationPath}/${sourceName}`;

      if (clipboardData.operation === 'copy') {
        if (clipboardData.isDirectory) await window.api.copyDir(clipboardData.sourcePath, destination);
        else await window.api.copyFile(clipboardData.sourcePath, destination);
      } else if (clipboardData.operation === 'cut') {
        await window.api.rename(clipboardData.sourcePath, destination);
        setClipboardData(null);
      }

      // fallback tiny update in case events are delayed
      setTimeout(() => setRefreshTrigger(prev => prev + 1), 20);
    } catch (error) {
      console.error("Erreur lors de l'opération:", error);
    }
  };

  if (!folder) {
    return (
      <div className="w-64 flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-gray-400 h-full">
        <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
          <h2 className="font-semibold text-gray-200">Explorateur</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <FolderOpen size={48} className="mb-4 text-gray-600" />
          <p className="text-center">Aucun dossier ouvert</p>
          <p className="text-xs text-center mt-2 text-gray-500">Ouvrez un dossier pour parcourir vos fichiers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-gray-400 h-full">
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider pl-2">Dossier ouvert</div>

       <FolderNode
        path={folder}
        name={getNameFromPath(folder)}
        onOpenFile={onOpenFile}
        onCreateItem={() => setRefreshTrigger(prev => prev + 1)}
        clipboardData={clipboardData}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        refreshTrigger={refreshTrigger}
        currentFilePath={currentFile?.path} // Nouvelle prop
      />
      </div>

      <div className="p-2 border-t border-gray-700 text-xs text-gray-500 bg-gray-800/50">
        <div className="flex justify-between"><span>Total:</span><span>~ fichiers</span></div>
        {clipboardData && (
          <div className="mt-1 flex items-center gap-1">
            <Clipboard size={10} />
            <span className="truncate">
              {clipboardData.operation === 'copy' ? 'Copier : ' : 'Déplacer : '}
              {clipboardData.sourcePath.split('/').pop()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
