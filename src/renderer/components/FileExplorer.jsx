import React, { useState, useEffect, useCallback } from "react";
import {
  Folder,
  FolderOpen,
  File,
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

// Composant récursif pour les dossiers
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

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const dirEntries = await window.api.readDir(path);
      setEntries(dirEntries);
    } catch (error) {
      console.error("Erreur lors de la lecture du dossier:", error);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open, loadEntries, refreshTrigger]);

  const toggle = async () => {
    setOpen(!open);
  };

  const handleCreateItem = (isFileType) => {
    setIsCreating(true);
    setIsFile(isFileType);
    setNewName(isFileType ? "nouveau_fichier.txt" : "nouveau_dossier");
  };

  const confirmCreate = async () => {
    if (newName.trim()) {
      const fullPath = `${path}/${newName}`;
      try {
        if (isFile) {
          await window.api.writeFile(fullPath, "");
        } else {
          await window.api.mkdir(fullPath);
        }
        setIsCreating(false);
        setNewName("");
        loadEntries(); // Rafraîchir la liste
        onCreateItem && onCreateItem(fullPath);
      } catch (error) {
        console.error("Erreur lors de la création:", error);
      }
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

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  useEffect(() => {
    document.addEventListener('click', closeContextMenu);
    return () => {
      document.removeEventListener('click', closeContextMenu);
    };
  }, []);

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();

    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml'].includes(extension)) {
      return <FileCode size={14} className="text-blue-400" />;
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return <FileImage size={14} className="text-green-400" />;
    }

    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) {
      return <FileArchive size={14} className="text-yellow-400" />;
    }

    if (['mp4', 'avi', 'mov', 'wmv', 'mkv'].includes(extension)) {
      return <FileVideo size={14} className="text-purple-400" />;
    }

    if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) {
      return <FileAudio size={14} className="text-pink-400" />;
    }

    return <FileText size={14} className="text-gray-400" />;
  };

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

        {open ? (
          <FolderOpen size={16} className="text-yellow-400" />
        ) : (
          <Folder size={16} className="text-yellow-500" />
        )}
        <span className="truncate flex-1">{name}</span>
        <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
          {entries.length}
        </span>
      </div>

      {open && (
        <div className="ml-3 border-l border-gray-700 pl-1">
          {isCreating && (
            <div className="flex items-center gap-1 pl-5 text-gray-300 px-2 py-1">
              {isFile ?
                <FileText size={14} className="text-gray-400" /> :
                <Folder size={14} className="text-yellow-500" />
              }
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
            const isDirectory = entry.isDir || entry.isDirectory;
            if (isDirectory) {
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
          <div
            className="px-3 py-1 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleCreateItem(true)}
          >
            Nouveau fichier
          </div>
          <div
            className="px-3 py-1 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleCreateItem(false)}
          >
            Nouveau dossier
          </div>
        </div>
      )}
    </div>
  );
}

// Fonction utilitaire pour formater la taille des fichiers
function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// Composant principal
export default function FileExplorer({ folder, onOpenFile }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [clipboardData, setClipboardData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateFile = () => {
    // Cette fonctionnalité est maintenant gérée dans le context menu
  };

  const handleCreateFolder = () => {
    // Cette fonctionnalité est maintenant gérée dans le context menu
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCopy = (path, isDirectory) => {
    setClipboardData({
      operation: 'copy',
      sourcePath: path,
      isDirectory: isDirectory
    });
  };

  const handleCut = (path, isDirectory) => {
    setClipboardData({
      operation: 'cut',
      sourcePath: path,
      isDirectory: isDirectory
    });
  };

  const handlePaste = async (destinationPath) => {
    if (!clipboardData) return;

    try {
      const sourceName = clipboardData.sourcePath.split('/').pop();
      const destination = `${destinationPath}/${sourceName}`;

      if (clipboardData.operation === 'copy') {
        if (clipboardData.isDirectory) {
          await window.api.copyDir(clipboardData.sourcePath, destination);
        } else {
          await window.api.copyFile(clipboardData.sourcePath, destination);
        }
      } else if (clipboardData.operation === 'cut') {
        await window.api.rename(clipboardData.sourcePath, destination);
        setClipboardData(null); // Clear clipboard after move
      }

      // Rafraîchir l'explorateur
      setRefreshTrigger(prev => prev + 1);
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
          <p className="text-xs text-center mt-2 text-gray-500">
            Ouvrez un dossier pour parcourir vos fichiers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-gray-400 h-full">
      {/* En-tête avec barre de recherche et actions */}
      <div className="p-2 border-b border-gray-700 bg-gray-800/90">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-200 text-sm">EXPLORATEUR</h2>
          <div className="flex gap-1">
            <button
              className="p-1 rounded hover:bg-gray-700 transition"
              title="Nouveau fichier"
              onClick={handleCreateFile}
            >
              <FilePlus size={14} />
            </button>
            <button
              className="p-1 rounded hover:bg-gray-700 transition"
              title="Nouveau dossier"
              onClick={handleCreateFolder}
            >
              <FolderPlus size={14} />
            </button>
            <button
              className="p-1 rounded hover:bg-gray-700 transition"
              title="Actualiser"
              onClick={handleRefresh}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-2 top-2 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded pl-8 pr-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Contenu de l'explorateur */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider pl-2">
          Dossier ouvert
        </div>

        <FolderNode
          path={folder}
          name={folder.split("/").pop()}
          onOpenFile={onOpenFile}
          onCreateItem={() => setRefreshTrigger(prev => prev + 1)}
          clipboardData={clipboardData}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Pied de page avec informations */}
      <div className="p-2 border-t border-gray-700 text-xs text-gray-500 bg-gray-800/50">
        <div className="flex justify-between">
          <span>Total:</span>
          <span>~ fichiers</span>
        </div>
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