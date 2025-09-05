import React, { useState } from "react";
import { 
  FolderPlus, 
  FolderOpen, 
  FileText, 
  Settings, 
  Github, 
  HelpCircle,
  Palette,
  Zap
} from "lucide-react";

export default function Sidebar({ onOpenFolder, onNewFile, onSettings }) {
  const [activeButton, setActiveButton] = useState(null);

  const handleOpenFolder = async () => {
    setActiveButton('open');
    const folder = await window.api.openFolder();
    if (folder) onOpenFolder(folder);
    setTimeout(() => setActiveButton(null), 300);
  };

  const handleButtonClick = (action) => {
    setActiveButton(action);
    setTimeout(() => setActiveButton(null), 300);
  };

  return (
    <div className="w-16 h-full flex flex-col items-center bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 py-6">
      <div className="flex flex-col items-center gap-6">
      
        {/* Actions principales */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleOpenFolder}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
              activeButton === 'open' 
                ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            title="Ouvrir un dossier"
          >
            <FolderOpen size={22} />
            <span className="text-xs mt-1">Ouvrir</span>
          </button>

          <button
            onClick={() => {
              handleButtonClick('new');
              onNewFile && onNewFile();
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
              activeButton === 'new' 
                ? 'bg-green-600 text-white shadow-lg transform scale-105' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            title="Nouveau fichier"
          >
            <FileText size={22} />
            <span className="text-xs mt-1">Nouveau</span>
          </button>
        </div>

        <div className="w-8 h-px bg-gray-700 my-2"></div>

        {/* Actions secondaires */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => {
              handleButtonClick('theme');
              // Fonctionnalité pour changer de thème
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
              activeButton === 'theme' 
                ? 'bg-purple-600 text-white shadow-lg transform scale-105' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            title="Changer de thème"
          >
            <Palette size={20} />
            <span className="text-xs mt-1">Thème</span>
          </button>
        </div>
      </div>

      {/* Actions en bas de la sidebar */}
      <div className="mt-auto flex flex-col gap-4">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
          title="GitHub"
        >
          <Github size={20} />
        </a>

        <button
          onClick={() => {
            handleButtonClick('help');
            // Fonctionnalité d'aide
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
            activeButton === 'help' 
              ? 'bg-indigo-600 text-white shadow-lg transform scale-105' 
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
          title="Aide"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      {/* Indicateur de statut */}
      <div className="mt-4 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-green-500" title="Connecté"></div>
      </div>
    </div>
  );
}