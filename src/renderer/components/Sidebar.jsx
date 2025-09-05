import React from "react";
import { FolderPlus } from "lucide-react";

export default function Sidebar({ onOpenFolder }) {
  const handleOpenFolder = async () => {
    const folder = await window.api.openFolder();
    if (folder) onOpenFolder(folder);
  };

  return (
    <div className="w-16 h-full flex flex-col items-center bg-gray-900 border-r border-gray-700 py-4">
      <button
        onClick={handleOpenFolder}
        className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-700 text-gray-300 transition"
      >
        <FolderPlus size={22} className="text-blue-400" />
        <span className="text-xs">Ouvrir</span>
      </button>
    </div>
  );
}
