import React from "react";
import SidebarButton from "./SidebarButton";
import { FolderOpen, FileText, Palette, Github, HelpCircle } from "lucide-react";

/**
 * SidebarView (presentational)
 * - reçoit handlers et state via props
 */
export default function SidebarView({
  activeButton,
  onOpenFolder,
  onNewFile,
  onToggleTheme,
  onSettings,
  onOpenGithub,
  recentFolders = [],
  onOpenRecent,
  onClearRecent
}) {
  return (
    <div className="w-16 h-full flex flex-col items-center bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 py-6">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col gap-4">
          <SidebarButton Icon={FolderOpen} label="Ouvrir" active={activeButton === "open"} onClick={onOpenFolder} />
          <SidebarButton Icon={FileText} label="Nouveau" active={activeButton === "new"} onClick={onNewFile} />
        </div>

        <div className="w-8 h-px bg-gray-700 my-2"></div>

        <div className="flex flex-col gap-4">
          <SidebarButton Icon={Palette} label="Thème" active={activeButton === "theme"} onClick={onToggleTheme} />
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <a href="#" onClick={onOpenGithub} className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200" title="GitHub">
          <Github size={20} />
        </a>

        <SidebarButton Icon={HelpCircle} label="Aide" active={activeButton === "help"} onClick={onSettings} />
      </div>

      <div className="mt-4 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-green-500" title="Connecté"></div>
      </div>

      {/* Optionnel: liste de dossiers récents (compact) */}
      {recentFolders.length > 0 && (
        <div className="absolute left-20 bottom-6 w-48 p-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
          <div className="text-xs text-gray-400 mb-1">Récents</div>
          <ul className="text-sm text-gray-200 space-y-1 max-h-40 overflow-auto">
            {recentFolders.map((f, i) => (
              <li key={f} className="truncate">
                <button onClick={() => onOpenRecent(f)} className="w-full text-left hover:text-white text-xs">{f.split("/").pop()}</button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between">
            <button onClick={onClearRecent} className="text-xs text-red-400">Effacer</button>
            <span className="text-xs text-gray-500">{recentFolders.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
