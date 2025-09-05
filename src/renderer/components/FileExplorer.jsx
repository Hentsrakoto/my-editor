import React, { useState } from "react";
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
  FilePlus
} from "lucide-react";

// Composant récursif pour les dossiers
function FolderNode({ path, name, onOpenFile, level = 0 }) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open) {
      setLoading(true);
      try {
        const dirEntries = await window.api.readDir(path);
        setEntries(dirEntries);
      } catch (error) {
        console.error("Erreur lors de la lecture du dossier:", error);
      } finally {
        setLoading(false);
      }
    }
    setOpen(!open);
  };

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
          {entries.map((e) => {
            const fullPath = `${path}/${e.name}`;
            if (e.isDir) {
              return (
                <FolderNode
                  key={fullPath}
                  path={fullPath}
                  name={e.name}
                  onOpenFile={onOpenFile}
                  level={level + 1}
                />
              );
            }
            return (
              <div
                key={fullPath}
                onClick={() => onOpenFile(fullPath)}
                className="flex items-center gap-1 pl-5 cursor-pointer text-gray-300 hover:bg-gray-700 px-2 py-1 rounded transition-colors duration-150 group"
              >
                {getFileIcon(e.name)}
                <span className="truncate flex-1">{e.name}</span>
                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {e.size ? formatFileSize(e.size) : ''}
                </span>
              </div>
            );
          })}
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
            <button className="p-1 rounded hover:bg-gray-700 transition" title="Nouveau fichier">
              <FilePlus size={14} />
            </button>
            <button className="p-1 rounded hover:bg-gray-700 transition" title="Nouveau dossier">
              <FolderPlus size={14} />
            </button>
            <button className="p-1 rounded hover:bg-gray-700 transition" title="Actualiser">
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
        />
      </div>

      {/* Pied de page avec informations */}
      <div className="p-2 border-t border-gray-700 text-xs text-gray-500 bg-gray-800/50">
        <div className="flex justify-between">
          <span>Total:</span>
          <span>~ fichiers</span>
        </div>
      </div>
    </div>
  );
}